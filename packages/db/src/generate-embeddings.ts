import { sql } from "./config.js";
import {
  computeEmbedding,
  composeEmbeddingText,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "./embed.js";

/**
 * Optional: `--langs=en,es,it` to limit which languages get embeddings.
 * If omitted, uses every distinct `lang` in `knowledge.summary_multilang`.
 */
function parseLangsFromArgv(): string[] | null {
  const prefixed = process.argv.find((a) => a.startsWith("--langs="));
  if (prefixed) {
    return prefixed
      .slice("--langs=".length)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return null;
}

async function main() {
  console.log("Generating composed embeddings for documents in knowledge schema...\n");
  console.log(`Model: ${EMBEDDING_MODEL}  Dimensions: ${EMBEDDING_DIMENSIONS}\n`);

  const fromArgv = parseLangsFromArgv();
  let langs: string[];

  if (fromArgv && fromArgv.length > 0) {
    langs = fromArgv;
    console.log(`Languages (from --langs): ${langs.join(", ")}\n`);
  } else {
    const langRows = await sql`
      SELECT DISTINCT lang FROM knowledge.summary_multilang ORDER BY lang
    `;
    langs = langRows.map((r) => (r as { lang: string }).lang);
    console.log(`Languages (from DB): ${langs.join(", ")}\n`);
  }

  if (langs.length === 0) {
    console.log("No languages to process. Exiting.");
    await sql.end();
    return;
  }

  let computed = 0;
  let cached = 0;
  let skipped = 0;

  for (const lang of langs) {
    console.log(`--- lang=${lang} ---\n`);

    const docs = await sql`
      SELECT
        d.id AS document_id,
        d.document_uid,
        sm.title,
        sm.summary,
        f.fulltext
      FROM knowledge.documents d
      LEFT JOIN knowledge.summary_multilang sm
        ON sm.document_id = d.id AND sm.lang = ${lang}
      LEFT JOIN knowledge.fulltext f
        ON f.document_id = d.id AND f.lang = ${lang}
      ORDER BY d.document_uid
    `;

    console.log(`Found ${docs.length} document row(s) for lang=${lang}\n`);

    for (const doc of docs) {
      const text = composeEmbeddingText(
        doc.title as string | null,
        doc.summary as string | null,
        doc.fulltext as string | null,
      );

      if (!text) {
        console.warn(`  [SKIP] ${doc.document_uid as string} (${lang}): no text to embed`);
        skipped++;
        continue;
      }

      try {
        const result = await computeEmbedding(text);
        const vectorLiteral = `[${result.embedding.join(",")}]`;

        await sql.unsafe(
          `INSERT INTO knowledge.embeddings (document_id, lang, content_type, model, dimensions, embedding)
           VALUES ($1, $2, $3, $4, $5, $6::vector)
           ON CONFLICT (document_id, lang, content_type) DO UPDATE SET
             model      = EXCLUDED.model,
             dimensions = EXCLUDED.dimensions,
             embedding  = EXCLUDED.embedding`,
          [doc.document_id, lang, "composed", EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, vectorLiteral],
        );

        if (result.cached) {
          cached++;
          console.log(`  [EMB] ${doc.document_uid as string} (${lang}) -> cached`);
        } else {
          computed++;
          console.log(`  [EMB] ${doc.document_uid as string} (${lang}) -> computed`);
        }
      } catch (err) {
        console.warn(`  [ERR] ${doc.document_uid as string} (${lang}):`, err);
        skipped++;
      }
    }
  }

  console.log(`\nDone. Computed: ${computed}, Cached: ${cached}, Skipped: ${skipped}`);
  await sql.end();
}

main().catch((err) => {
  console.error("Embedding generation failed:", err);
  process.exit(1);
});
