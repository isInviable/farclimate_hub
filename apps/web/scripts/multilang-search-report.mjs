#!/usr/bin/env node
/**
 * Run the multilingual free-text search matrix and write docs/multilang-free-text-search-report.md
 *
 * Usage:
 *   NUXT_TEST_BASE_URL=http://localhost:3000 node scripts/multilang-search-report.mjs
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const REPORT_PATH = resolve(REPO_ROOT, "docs/multilang-free-text-search-report.md");
const PARITY_REPORT_PATH = resolve(
  REPO_ROOT,
  "pipeline/caches/translation_parity_report.json",
);

const MATRIX = [
  {
    id: "forestry",
    label: "Forestry / silviculture",
    queries: { es: "silvicultura", en: "forestry", it: "silvicoltura" },
  },
  {
    id: "agriculture",
    label: "Agriculture",
    queries: { es: "agricultura", en: "agriculture", it: "agricoltura" },
  },
  {
    id: "mediterranean_fires",
    label: "Mediterranean wildfires",
    queries: {
      es: "incendios mediterraneo",
      en: "mediterranean wildfires",
      it: "incendi mediterranei",
    },
  },
  {
    id: "crop_climate_adaptation",
    label: "Climate adaptation of crops",
    queries: {
      es: "adaptacion climatica de cultivos",
      en: "climate adaptation of crops",
      it: "adattamento climatico colture",
    },
  },
];

const LANGS = ["en", "es", "it"];
const TOP_N = 15;

const baseUrl = process.env.NUXT_TEST_BASE_URL;
if (!baseUrl) {
  console.error("Set NUXT_TEST_BASE_URL (e.g. http://localhost:3000)");
  process.exit(1);
}

async function search(query, lang) {
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
  if (!res.ok) throw new Error(`${lang}/${query}: HTTP ${res.status}`);
  return res.json();
}

function uidFromHit(hit) {
  return hit.document?.document_uid ?? hit.document_uid ?? null;
}

function loadParityReport() {
  if (!existsSync(PARITY_REPORT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(PARITY_REPORT_PATH, "utf8"));
  } catch {
    return null;
  }
}

function buildParitySection(parity) {
  if (!parity || typeof parity !== "object") return [];

  const rows = [];
  for (const [sourceFile, langs] of Object.entries(parity)) {
    for (const [lang, stats] of Object.entries(langs)) {
      rows.push({
        sourceFile,
        lang,
        sourceLen: stats.source_len ?? 0,
        translatedLen: stats.translated_len ?? 0,
        ratio: stats.ratio ?? 0,
        belowFloor: Boolean(stats.below_floor),
      });
    }
  }
  if (rows.length === 0) return [];

  rows.sort((a, b) => a.ratio - b.ratio);
  const below = rows.filter((r) => r.belowFloor);
  const ratios = rows.map((r) => r.ratio);
  const avgRatio = ratios.reduce((s, r) => s + r, 0) / ratios.length;

  const lines = [
    "## Translation length parity (pipeline)",
    "",
    `Source: \`pipeline/caches/translation_parity_report.json\` (${rows.length} document×lang pairs).`,
    "",
    `Average fulltext length ratio (translated/source): **${avgRatio.toFixed(2)}**.`,
    `Below floor (ratio < 0.5): **${below.length}**.`,
    "",
  ];

  if (below.length > 0) {
    lines.push("| Source file | Lang | Source len | Translated len | Ratio |", "|-------------|------|------------|----------------|-------|");
    for (const r of below.slice(0, 20)) {
      lines.push(
        `| \`${r.sourceFile}\` | ${r.lang} | ${r.sourceLen} | ${r.translatedLen} | ${r.ratio.toFixed(2)} |`,
      );
    }
    if (below.length > 20) {
      lines.push("", `_…and ${below.length - 20} more below floor._`, "");
    } else {
      lines.push("");
    }
  }

  return lines;
}

function buildReport(snapshots, generatedAt, parity) {
  const lines = [
    "# Multilingual free-text search parity report",
    "",
    `Generated: ${generatedAt}`,
    "",
    "Endpoint: `POST /api/explorer-search` with `includeFacets: false`, `limit: 15`, hybrid mode (default).",
    "",
    "Each intent uses the same informational need in three languages (`lang` must match query language).",
    "",
    "## Summary",
    "",
    "| Intent | Query (ES) | EN total | ES total | IT total | Overlap top-15 (all 3 langs) |",
    "|--------|------------|----------|----------|----------|-------------------------------|",
  ];

  for (const s of snapshots) {
    lines.push(
      `| ${s.label} | \`${s.byLang.es.query}\` | ${s.byLang.en.total} | ${s.byLang.es.total} | ${s.byLang.it.total} | ${s.overlap.allThree} |`,
    );
  }

  lines.push(
    "",
    "## Findings",
    "",
    "1. **English dominates recall** for forestry and crop-adaptation intents (ES/IT often 0 or much lower).",
    "2. **Same case studies do align** when translations share distinctive terms (e.g. CALCHAS for Mediterranean fires; drought insurance Austria for agriculture).",
    "3. **Infrastructure is per-language** (separate fulltext + embeddings per `lang`); gaps are mostly vocabulary and translation coverage, not facet logic.",
    "4. **Italian FTS** was fixed (index/query both use `italian`); remaining IT gaps vs EN are content/synonym issues.",
    "",
  );

  lines.push(...buildParitySection(parity));

  lines.push(
    "## Detail by intent",
    "",
  );

  for (const s of snapshots) {
    lines.push(`### ${s.label} (\`${s.id}\`)`, "");
    lines.push("| Lang | Query | Total | Mode | Top titles |");
    lines.push("|------|-------|-------|------|------------|");
    for (const lang of LANGS) {
      const r = s.byLang[lang];
      const titles =
        r.topTitles.length > 0
          ? r.topTitles.slice(0, 3).map((t) => t.replace(/\|/g, "\\|")).join("<br>")
          : "—";
      lines.push(`| ${lang} | \`${r.query}\` | ${r.total} | ${r.mode ?? "—"} | ${titles} |`);
    }
    lines.push(
      "",
      `Overlap in top-${TOP_N} \`document_uid\`: all three = **${s.overlap.allThree}**; en∩es = ${s.overlap.enEs}; en∩it = ${s.overlap.enIt}; es∩it = ${s.overlap.esIt}.`,
      "",
    );
    if (s.overlap.sharedUids.length > 0) {
      lines.push("Shared across EN, ES, IT:", "");
      for (const uid of s.overlap.sharedUids) {
        lines.push(`- \`${uid}\``);
      }
      lines.push("");
    }
  }

  lines.push(
    "## Proposed solutions (equivalence)",
    "",
    "### Short term (product / API)",
    "",
    "1. **Query expansion per locale** — Before search, map common domain phrases to synonym lists (e.g. ES `silvicultura` → also search `forestal`, `gestión forestal`; IT `silvicoltura` → `forestale`). Can live in app layer or a small `search_query_expansions` table.",
    "2. **Lower `min_score` only for non-EN** — Riskier; prefer tuning hybrid weights (`semantic_weight` / `full_text_weight`) per `lang` if semantic leg under-recalls.",
    "3. **Expose search mode in UI** — Let power users switch keyword vs hybrid when results are empty (debugging and fallback).",
    "",
    "### Medium term (content pipeline)",
    "",
    "4. **Glossary injection in translations** — When generating `*_en_augmented_es.json` / `_it`, ensure sector/topic terms from EN (forestry, crops, wildfire) appear in summary/fulltext in the target language.",
    "5. **Regenerate embeddings after glossary pass** — `pnpm db:embed -- --langs=es,it` so semantic leg sees enriched text.",
    "",
    "### Long term (search architecture)",
    "",
    "6. **Cross-lingual retrieval** — Single query embeds once; search union of langs or map to `document_id` then hydrate in user locale (best parity, more engineering).",
    "7. **Multilingual embedding model** — One index across languages (e.g. multilingual E5) instead of three isolated indexes.",
    "8. **Postgres synonym dictionaries** — `CREATE TEXT SEARCH DICTIONARY` / thesaurus per language for FTS leg alignment with EN concepts.",
    "",
    "### Monitoring",
    "",
    "Re-run this matrix after changes:",
    "",
    "```bash",
    "NUXT_TEST_BASE_URL=http://localhost:3000 node apps/web/scripts/multilang-search-report.mjs",
    "NUXT_TEST_BASE_URL=http://localhost:3000 pnpm --filter web test tests/api/explorer-search.multilang-matrix.test.ts",
    "```",
    "",
  );

  return lines.join("\n");
}

const snapshots = [];
for (const row of MATRIX) {
  const byLang = {};
  for (const lang of LANGS) {
    const data = await search(row.queries[lang], lang);
    const hits = data.hits ?? [];
    byLang[lang] = {
      query: row.queries[lang],
      total: data.total ?? data.count ?? 0,
      mode: data.debug?.mode,
      topTitles: hits
        .map((h) => h.document?.title)
        .filter(Boolean)
        .slice(0, 5),
      uids: hits.map(uidFromHit).filter(Boolean),
    };
  }
  const en = new Set(byLang.en.uids);
  const es = new Set(byLang.es.uids);
  const it = new Set(byLang.it.uids);
  snapshots.push({
    id: row.id,
    label: row.label,
    byLang,
    overlap: {
      allThree: [...en].filter((u) => es.has(u) && it.has(u)).length,
      enEs: [...en].filter((u) => es.has(u)).length,
      enIt: [...en].filter((u) => it.has(u)).length,
      esIt: [...es].filter((u) => it.has(u)).length,
      sharedUids: [...en].filter((u) => es.has(u) && it.has(u)),
    },
  });
}

const md = buildReport(snapshots, new Date().toISOString(), loadParityReport());
writeFileSync(REPORT_PATH, md, "utf8");
console.log(`Wrote ${REPORT_PATH}`);
for (const s of snapshots) {
  console.log(
    `  ${s.id}: en=${s.byLang.en.total} es=${s.byLang.es.total} it=${s.byLang.it.total} overlap=${s.overlap.allThree}`,
  );
}
