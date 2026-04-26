import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "./config.js";
import {
  computeEmbedding,
  composeEmbeddingText,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "./embed.js";
import { slugFromSourceUrl, syncDocumentImagesForSlug } from "./document-images.js";

const AUGMENTED_DIR = resolve(import.meta.dirname, "..", "..", "..", "pipeline", "augmented");
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

/** True if at least one ingredient has non-blank string content (matches UI / explorer behavior). */
function recipeIngredientsHasContent(ingredients: Record<string, unknown>): boolean {
  for (const v of Object.values(ingredients)) {
    if (typeof v === "string" && v.trim().length > 0) return true;
    if (v != null && typeof v !== "string") return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Upsert functions
// ---------------------------------------------------------------------------

async function upsertDocument(doc: Record<string, unknown>): Promise<string> {
  const uid = buildDocumentUid(doc.source_url as string | undefined, doc.source_file as string);

  const [row] = await sql`
    INSERT INTO knowledge.documents (document_uid, source_type, source_url, source_file, title, creation_date)
    VALUES (
      ${uid},
      ${SOURCE_TYPE},
      ${(doc.source_url as string) ?? null},
      ${(doc.source_file as string) ?? null},
      ${(doc.title as string) ?? null},
      ${(doc.creation_date as string) ?? null}
    )
    ON CONFLICT (document_uid) DO UPDATE SET
      source_url    = EXCLUDED.source_url,
      source_file   = EXCLUDED.source_file,
      title         = EXCLUDED.title,
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

  const healthImpact = (doc.health_impact as string) ?? null;

  const costEstimation = (doc.cost_estimation as number | null) ?? null;

  await sql`
    INSERT INTO knowledge.summary (
      document_id, keywords, climate_impacts, adaptation_approaches, sectors,
      adapt_options, geographic_characterisation, health_impact,
      location_lat, location_lon,
      implementation_years_start, implementation_years_end,
      contact_preprocessed, references_preprocessed, cost_estimation, websites
    )
    VALUES (
      ${documentId},
      ${(doc.keywords as string[]) ?? null},
      ${(doc.climate_impacts as string[]) ?? null},
      ${(doc.adaptation_approaches as string[]) ?? null},
      ${(doc.sectors as string[]) ?? null},
      ${adaptOptions ? sql.json(adaptOptions) : null},
      ${geo ? sql.json(geo) : null},
      ${healthImpact},
      ${loc?.lat ?? null},
      ${loc?.lon ?? null},
      ${years?.start_year ?? null},
      ${years?.end_year ?? null},
      ${(doc.contact_preprocessed as string) ?? null},
      ${(doc.references_preprocessed as string) ?? null},
      ${costEstimation},
      ${doc.websites ? sql.json(doc.websites) : null}
    )
    ON CONFLICT (document_id) DO UPDATE SET
      keywords                    = EXCLUDED.keywords,
      climate_impacts             = EXCLUDED.climate_impacts,
      adaptation_approaches       = EXCLUDED.adaptation_approaches,
      sectors                     = EXCLUDED.sectors,
      adapt_options               = EXCLUDED.adapt_options,
      geographic_characterisation = EXCLUDED.geographic_characterisation,
      health_impact               = EXCLUDED.health_impact,
      location_lat                = EXCLUDED.location_lat,
      location_lon                = EXCLUDED.location_lon,
      implementation_years_start  = EXCLUDED.implementation_years_start,
      implementation_years_end    = EXCLUDED.implementation_years_end,
      contact_preprocessed        = EXCLUDED.contact_preprocessed,
      references_preprocessed     = EXCLUDED.references_preprocessed,
      cost_estimation             = EXCLUDED.cost_estimation,
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

async function upsertRecipe(
  documentId: string,
  lang: string,
  ingredients: Record<string, unknown>,
): Promise<void> {
  const payload: Record<string, string> = {};
  for (const [k, v] of Object.entries(ingredients)) {
    if (typeof v === "string") payload[k] = v;
    else if (v != null) payload[k] = JSON.stringify(v);
  }
  await sql`
    INSERT INTO knowledge.recipe (document_id, lang, ingredients)
    VALUES (${documentId}, ${lang}, ${sql.json(payload)})
    ON CONFLICT (document_id, lang) DO UPDATE SET
      ingredients = EXCLUDED.ingredients
  `;
}

async function upsertEmbedding(
  documentId: string,
  lang: string,
  contentType: string,
  model: string,
  dimensions: number,
  embedding: number[],
): Promise<void> {
  const vectorLiteral = `[${embedding.join(",")}]`;
  await sql.unsafe(
    `INSERT INTO knowledge.embeddings (document_id, lang, content_type, model, dimensions, embedding)
     VALUES ($1, $2, $3, $4, $5, $6::vector)
     ON CONFLICT (document_id, lang, content_type) DO UPDATE SET
       model      = EXCLUDED.model,
       dimensions = EXCLUDED.dimensions,
       embedding  = EXCLUDED.embedding`,
    [documentId, lang, contentType, model, dimensions, vectorLiteral],
  );
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

    const slug = slugFromSourceUrl(doc.source_url as string | undefined);
    if (slug) {
      try {
        const uploadedCount = await syncDocumentImagesForSlug(documentId, slug);
        console.log(`  [IMG] ${slug}: ${uploadedCount} images synced`);
      } catch (err) {
        console.warn(`  [IMG] ${slug}: sync failed:`, err);
      }
    }

    await upsertSummary(documentId, doc);
    await upsertSummaryMultilang(documentId, "en", {
      title: doc.title as string | undefined,
      subtitle: doc.subtitle as string | undefined,
      summary: doc.summary as string | undefined,
    });
    await upsertFulltext(documentId, "en", (doc.fulltext as string) ?? null);

    const recipe = doc.recipe as { lang?: string; ingredients?: Record<string, unknown> } | undefined;
    if (recipe?.ingredients && typeof recipe.ingredients === "object" && !Array.isArray(recipe.ingredients)) {
      if (recipeIngredientsHasContent(recipe.ingredients)) {
        const recipeLang = typeof recipe.lang === "string" && recipe.lang ? recipe.lang : "en";
        await upsertRecipe(documentId, recipeLang, recipe.ingredients);
      } else {
        console.warn(`  [RECIPE] skip (all empty): ${sourceFile}`);
      }
    }

    const embeddingText = composeEmbeddingText(
      doc.title as string | undefined,
      doc.summary as string | undefined,
      doc.fulltext as string | undefined,
    );
    if (embeddingText) {
      try {
        const uid = buildDocumentUid(doc.source_url as string, sourceFile);
        const { embedding, cached } = await computeEmbedding(embeddingText);
        await upsertEmbedding(
          documentId,
          "en",
          "composed",
          EMBEDDING_MODEL,
          EMBEDDING_DIMENSIONS,
          embedding,
        );
        console.log(`  [EMB] ${uid} -> ${cached ? "cached" : "computed"}`);
      } catch (err) {
        console.warn(`  [EMB] Failed for ${sourceFile}:`, err);
      }
    } else {
      console.warn(`  [EMB] Skipping ${sourceFile}: no text to embed`);
    }
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

    const transLang =
      typeof trans.lang === "string" && trans.lang.trim().length > 0
        ? trans.lang.trim()
        : "es";

    await upsertSummaryMultilang(documentId, transLang, {
      title: trans.title as string | undefined,
      subtitle: trans.subtitle as string | undefined,
      summary: trans.summary as string | undefined,
    });
    await upsertFulltext(documentId, transLang, (trans.fulltext as string) ?? null);

    const recipe = trans.recipe as
      | { lang?: string; ingredients?: Record<string, unknown> }
      | undefined;
    if (
      recipe?.ingredients &&
      typeof recipe.ingredients === "object" &&
      !Array.isArray(recipe.ingredients)
    ) {
      if (recipeIngredientsHasContent(recipe.ingredients)) {
        const recipeLang =
          typeof recipe.lang === "string" && recipe.lang.trim().length > 0
            ? recipe.lang.trim()
            : transLang;
        if (recipeLang !== transLang) {
          console.warn(
            `  [RECIPE] recipe.lang (${recipeLang}) != translation lang (${transLang}); skipping translated recipe upsert`,
          );
        } else {
          await upsertRecipe(documentId, transLang, recipe.ingredients);
        }
      }
    }
  }

  console.log(`\nDone. Pushed ${enFiles.length} documents with ${esFiles.length} translations.`);
  await sql.end();
}

main().catch((err) => {
  console.error("Push failed:", err);
  process.exit(1);
});
