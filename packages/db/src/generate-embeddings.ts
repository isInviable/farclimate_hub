import { sql } from "./config.js";
import {
  computeEmbedding,
  composeEmbeddingText,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "./embed.js";

async function main() {
  console.log("Generating embeddings for all documents in knowledge schema...\n");
  console.log(`Model: ${EMBEDDING_MODEL}  Dimensions: ${EMBEDDING_DIMENSIONS}\n`);

  const docs = await sql`
    SELECT
      d.id AS document_id,
      d.document_uid,
      sm.title,
      sm.summary,
      f.fulltext
    FROM knowledge.documents d
    LEFT JOIN knowledge.summary_multilang sm
      ON sm.document_id = d.id AND sm.lang = 'en'
    LEFT JOIN knowledge.fulltext f
      ON f.document_id = d.id AND f.lang = 'en'
    ORDER BY d.document_uid
  `;

  console.log(`Found ${docs.length} documents\n`);

  let computed = 0;
  let cached = 0;
  let skipped = 0;

  for (const doc of docs) {
    const text = composeEmbeddingText(
      doc.title as string | null,
      doc.summary as string | null,
      doc.fulltext as string | null,
    );

    if (!text) {
      console.warn(`  [SKIP] ${doc.document_uid}: no text to embed`);
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
        [doc.document_id, "en", "composed", EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, vectorLiteral],
      );

      if (result.cached) {
        cached++;
        console.log(`  [EMB] ${doc.document_uid} -> cached`);
      } else {
        computed++;
        console.log(`  [EMB] ${doc.document_uid} -> computed`);
      }
    } catch (err) {
      console.warn(`  [ERR] ${doc.document_uid}:`, err);
      skipped++;
    }
  }

  console.log(`\nDone. Computed: ${computed}, Cached: ${cached}, Skipped: ${skipped}`);
  await sql.end();
}

main().catch((err) => {
  console.error("Embedding generation failed:", err);
  process.exit(1);
});
