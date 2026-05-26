/**
 * Multilingual free-text search parity matrix for POST /api/explorer-search.
 *
 * Run with a live Nuxt server:
 *   NUXT_TEST_BASE_URL=http://localhost:3000 pnpm test tests/api/explorer-search.multilang-matrix.test.ts
 *
 * Regenerate the markdown report:
 *   NUXT_TEST_BASE_URL=http://localhost:3000 node scripts/multilang-search-report.mjs
 */
import { describe, expect, it } from "vitest";
import type { ExplorerSearchResponse } from "../../app/types/explorerSearch";
import {
  KNOWLEDGE_LANGS,
  MULTILANG_SEARCH_MATRIX,
  type KnowledgeLang,
} from "../fixtures/multilangSearchMatrix";

const TOP_N = 15;

export interface LangSearchSnapshot {
  query: string;
  total: number;
  matchedCount: number | undefined;
  mode: string | undefined;
  documentUids: string[];
  topTitles: string[];
}

export interface IntentParitySnapshot {
  id: string;
  label: string;
  byLang: Record<KnowledgeLang, LangSearchSnapshot>;
  overlapTopN: {
    allThree: number;
    enEs: number;
    enIt: number;
    esIt: number;
    sharedUids: string[];
  };
}

async function explorerSearch(
  baseUrl: string,
  query: string,
  lang: KnowledgeLang,
): Promise<ExplorerSearchResponse & { debug?: { mode?: string; matched_count?: number } }> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/explorer-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      lang,
      limit: TOP_N,
      offset: 0,
      includeFacets: false,
      debug: true,
    }),
  });
  expect(res.ok).toBe(true);
  return (await res.json()) as ExplorerSearchResponse & {
    debug?: { mode?: string; matched_count?: number };
  };
}

function snapshotFromResponse(
  query: string,
  data: ExplorerSearchResponse & { debug?: { mode?: string; matched_count?: number } },
): LangSearchSnapshot {
  const hits = data.hits ?? [];
  const documentUids: string[] = [];
  const topTitles: string[] = [];
  for (const hit of hits) {
    const doc = hit.document as { document_uid?: string; title?: string } | undefined;
    const uid = doc?.document_uid ?? (hit as { document_uid?: string }).document_uid;
    if (uid) documentUids.push(uid);
    if (doc?.title) topTitles.push(doc.title.slice(0, 80));
  }
  return {
    query,
    total: data.total ?? data.count ?? 0,
    matchedCount: data.debug?.matched_count,
    mode: data.debug?.mode,
    documentUids,
    topTitles,
  };
}

export async function runMultilangSearchMatrix(baseUrl: string): Promise<IntentParitySnapshot[]> {
  const snapshots: IntentParitySnapshot[] = [];

  for (const row of MULTILANG_SEARCH_MATRIX) {
    const byLang = {} as Record<KnowledgeLang, LangSearchSnapshot>;
    for (const lang of KNOWLEDGE_LANGS) {
      const query = row.queries[lang];
      const data = await explorerSearch(baseUrl, query, lang);
      byLang[lang] = snapshotFromResponse(query, data);
    }

    const en = new Set(byLang.en.documentUids);
    const es = new Set(byLang.es.documentUids);
    const it = new Set(byLang.it.documentUids);
    const sharedUids = [...en].filter((uid) => es.has(uid) && it.has(uid));

    snapshots.push({
      id: row.id,
      label: row.label,
      byLang,
      overlapTopN: {
        allThree: sharedUids.length,
        enEs: [...en].filter((uid) => es.has(uid)).length,
        enIt: [...en].filter((uid) => it.has(uid)).length,
        esIt: [...es].filter((uid) => it.has(uid)).length,
        sharedUids,
      },
    });
  }

  return snapshots;
}

describe("POST /api/explorer-search multilingual free-text matrix", () => {
  const baseUrl = process.env.NUXT_TEST_BASE_URL;

  it("returns 200 for all intent × language queries", async () => {
    if (!baseUrl) return;
    const snapshots = await runMultilangSearchMatrix(baseUrl);
    expect(snapshots).toHaveLength(MULTILANG_SEARCH_MATRIX.length);
    for (const intent of snapshots) {
      for (const lang of KNOWLEDGE_LANGS) {
        expect(intent.byLang[lang].total).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("logs parity summary (see test output)", async () => {
    if (!baseUrl) return;
    const snapshots = await runMultilangSearchMatrix(baseUrl);
    const lines: string[] = ["Multilang search parity (top", String(TOP_N), "):"];
    for (const intent of snapshots) {
      const t = intent.byLang;
      lines.push(
        `  ${intent.id}: en=${t.en.total} es=${t.es.total} it=${t.it.total} | overlap all3=${intent.overlapTopN.allThree}`,
      );
    }
    // eslint-disable-next-line no-console -- intentional monitoring output
    console.log(lines.join("\n"));
  });
});
