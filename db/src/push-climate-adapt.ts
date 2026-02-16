import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "./config.js";

const AUGMENTED_DIR = resolve(import.meta.dirname, "..", "..", "pipeline", "augmented");
const SOURCE_TYPE = "climate_adapt_case_study";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the URL slug to build the document_uid.
 * "https://climate-adapt.eea.europa.eu/en/metadata/case-studies/some-slug"
 *  -> "climateadapt::some-slug"
 */
function buildDocumentUid(sourceUrl: string | undefined, sourceFile: string): string {
  if (sourceUrl) {
    const slug = sourceUrl.replace(/\/+$/, "").split("/").pop();
    if (slug) return `climateadapt::${slug}`;
  }
  // Fallback: use the source_file without extension
  const base = sourceFile.replace(/\.[^.]+$/, "");
  return `climateadapt::${base}`;
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

// ---------------------------------------------------------------------------
// Upsert functions
// ---------------------------------------------------------------------------

async function upsertDocument(doc: Record<string, unknown>): Promise<string> {
  const uid = buildDocumentUid(doc.source_url as string | undefined, doc.source_file as string);

  const [row] = await sql`
    INSERT INTO knowledge.documents (document_uid, source_type, source_url, source_file, title, image_url, creation_date)
    VALUES (
      ${uid},
      ${SOURCE_TYPE},
      ${(doc.source_url as string) ?? null},
      ${(doc.source_file as string) ?? null},
      ${(doc.title as string) ?? null},
      ${(doc.image_url as string) ?? null},
      ${(doc.creation_date as string) ?? null}
    )
    ON CONFLICT (document_uid) DO UPDATE SET
      source_url    = EXCLUDED.source_url,
      source_file   = EXCLUDED.source_file,
      title         = EXCLUDED.title,
      image_url     = EXCLUDED.image_url,
      creation_date = EXCLUDED.creation_date,
      updated_at    = now()
    RETURNING id
  `;

  return row.id as string;
}

async function upsertSummary(documentId: string, doc: Record<string, unknown>): Promise<void> {
  const adaptOptions = doc.adapt_options ?? null;
  const geo = doc.geographic_characterisation ?? null;
  const loc = doc.location as { lat?: number; lon?: number } | undefined;
  const years = doc.implementation_years as { start_year?: string; end_year?: string } | undefined;

  await sql`
    INSERT INTO knowledge.summary (
      document_id, keywords, climate_impacts, adaptation_approaches, sectors,
      adapt_options, geographic_characterisation,
      location_lat, location_lon,
      implementation_years_start, implementation_years_end,
      contact_preprocessed, references_preprocessed, websites
    )
    VALUES (
      ${documentId},
      ${(doc.keywords as string[]) ?? null},
      ${(doc.climate_impacts as string[]) ?? null},
      ${(doc.adaptation_approaches as string[]) ?? null},
      ${(doc.sectors as string[]) ?? null},
      ${adaptOptions ? sql.json(adaptOptions) : null},
      ${geo ? sql.json(geo) : null},
      ${loc?.lat ?? null},
      ${loc?.lon ?? null},
      ${years?.start_year ?? null},
      ${years?.end_year ?? null},
      ${(doc.contact_preprocessed as string) ?? null},
      ${(doc.references_preprocessed as string) ?? null},
      ${doc.websites ? sql.json(doc.websites) : null}
    )
    ON CONFLICT (document_id) DO UPDATE SET
      keywords                    = EXCLUDED.keywords,
      climate_impacts             = EXCLUDED.climate_impacts,
      adaptation_approaches       = EXCLUDED.adaptation_approaches,
      sectors                     = EXCLUDED.sectors,
      adapt_options               = EXCLUDED.adapt_options,
      geographic_characterisation = EXCLUDED.geographic_characterisation,
      location_lat                = EXCLUDED.location_lat,
      location_lon                = EXCLUDED.location_lon,
      implementation_years_start  = EXCLUDED.implementation_years_start,
      implementation_years_end    = EXCLUDED.implementation_years_end,
      contact_preprocessed        = EXCLUDED.contact_preprocessed,
      references_preprocessed     = EXCLUDED.references_preprocessed,
      websites                    = EXCLUDED.websites
  `;
}

async function upsertSummaryMultilang(
  documentId: string,
  lang: string,
  data: { title?: string; subtitle?: string; summary?: string },
): Promise<void> {
  await sql`
    INSERT INTO knowledge.summary_multilang (document_id, lang, title, subtitle, summary)
    VALUES (
      ${documentId},
      ${lang},
      ${data.title ?? null},
      ${data.subtitle ?? null},
      ${data.summary ?? null}
    )
    ON CONFLICT (document_id, lang) DO UPDATE SET
      title    = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      summary  = EXCLUDED.summary
  `;
}

async function upsertFulltext(
  documentId: string,
  lang: string,
  fulltext: string | null,
): Promise<void> {
  await sql`
    INSERT INTO knowledge.fulltext (document_id, lang, fulltext)
    VALUES (${documentId}, ${lang}, ${fulltext})
    ON CONFLICT (document_id, lang) DO UPDATE SET
      fulltext = EXCLUDED.fulltext
  `;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Reading augmented files from: ${AUGMENTED_DIR}\n`);

  const allFiles = readdirSync(AUGMENTED_DIR).filter((f) => f.endsWith(".json"));
  const enFiles = allFiles.filter((f) => f.match(/_en_augmented\.json$/));
  const esFiles = allFiles.filter((f) => f.match(/_en_augmented_es\.json$/));

  console.log(`Found ${enFiles.length} EN augmented files`);
  console.log(`Found ${esFiles.length} ES translation files\n`);

  // Build a map: source_file (e.g. "page_101.html") -> document UUID
  const sourceFileToId = new Map<string, string>();

  // --- Pass 1: Process EN augmented files ---
  for (const filename of enFiles) {
    const filePath = resolve(AUGMENTED_DIR, filename);
    const doc = readJson(filePath);
    const sourceFile = doc.source_file as string;

    console.log(`[EN] ${sourceFile} -> ${buildDocumentUid(doc.source_url as string, sourceFile)}`);

    const documentId = await upsertDocument(doc);
    sourceFileToId.set(sourceFile, documentId);

    await upsertSummary(documentId, doc);
    await upsertSummaryMultilang(documentId, "en", {
      title: doc.title as string | undefined,
      subtitle: doc.subtitle as string | undefined,
      summary: doc.summary as string | undefined,
    });
    await upsertFulltext(documentId, "en", (doc.fulltext as string) ?? null);
  }

  // --- Pass 2: Process ES translation files ---
  for (const filename of esFiles) {
    const filePath = resolve(AUGMENTED_DIR, filename);
    const trans = readJson(filePath);
    const sourceFile = trans.source_file as string;

    const documentId = sourceFileToId.get(sourceFile);
    if (!documentId) {
      console.warn(`  [WARN] No document found for ${sourceFile}, skipping ES translation`);
      continue;
    }

    console.log(`[ES] ${sourceFile} -> translation`);

    await upsertSummaryMultilang(documentId, "es", {
      title: trans.title as string | undefined,
      subtitle: trans.subtitle as string | undefined,
      summary: trans.summary as string | undefined,
    });
    await upsertFulltext(documentId, "es", (trans.fulltext as string) ?? null);
  }

  console.log(`\nDone. Pushed ${enFiles.length} documents with ${esFiles.length} translations.`);
  await sql.end();
}

main().catch((err) => {
  console.error("Push failed:", err);
  process.exit(1);
});
