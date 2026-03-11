/**
 * Verify that stored embeddings match the expected model and dimensions (768)
 * so they are compatible with query embeddings from the search API.
 *
 * Run from repo root: node packages/db/scripts/verify-embeddings.mjs
 */
import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
config({ path: resolve(__dirname, "..", "..", "..", ".env") });

const EXPECTED_DIMENSIONS = 768;
const EXPECTED_MODEL = "gemini-embedding-001";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

function embeddingLength(embedding) {
  if (Array.isArray(embedding)) return embedding.length;
  if (typeof embedding === "string") {
    const parsed = JSON.parse(embedding);
    return Array.isArray(parsed) ? parsed.length : 0;
  }
  return 0;
}

async function main() {
  console.log("Verifying knowledge.embeddings compatibility with search API...\n");

  const schema = await sql`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'knowledge' AND table_name = 'embeddings'
    ORDER BY ordinal_position
  `;
  const embeddingCol = schema.find((c) => c.column_name === "embedding");
  const dimensionsCol = schema.find((c) => c.column_name === "dimensions");
  const modelCol = schema.find((c) => c.column_name === "model");

  if (!embeddingCol) {
    console.error("FAIL: knowledge.embeddings table or embedding column not found.");
    process.exit(1);
  }

  console.log("Table knowledge.embeddings:");
  console.log("  embedding column type:", embeddingCol.udt_name || embeddingCol.data_type);
  console.log("  dimensions column:", dimensionsCol ? "yes" : "no");
  console.log("  model column:", modelCol ? "yes" : "no");

  const expectedType = `vector(${EXPECTED_DIMENSIONS})`;
  if (embeddingCol.udt_name && !embeddingCol.udt_name.includes("vector")) {
    console.warn("  WARN: embedding is not a vector type:", embeddingCol.udt_name);
  }

  const rows = await sql`
    SELECT id, document_id, lang, content_type, model, dimensions,
           embedding::text AS embedding_text
    FROM knowledge.embeddings
    LIMIT 5
  `;

  if (rows.length === 0) {
    console.log("\nNo rows in knowledge.embeddings. Nothing to verify.");
    process.exit(0);
  }

  console.log("\nSample rows:");
  let allOk = true;
  for (const r of rows) {
    const dim = r.dimensions;
    const vecText = r.embedding_text;
    let len = 0;
    if (vecText) {
      try {
        const arr = JSON.parse(vecText);
        len = Array.isArray(arr) ? arr.length : 0;
      } catch {
        len = -1;
      }
    }
    const lenOk = dim === EXPECTED_DIMENSIONS && len === EXPECTED_DIMENSIONS;
    const modelOk = !EXPECTED_MODEL || r.model === EXPECTED_MODEL;
    if (!lenOk || !modelOk) allOk = false;
    console.log(
      `  document_id=${r.document_id?.slice(0, 8)}... lang=${r.lang} model=${r.model} dimensions=${dim} vector_length=${len} ${lenOk && modelOk ? "OK" : "MISMATCH"}`
    );
  }

  const agg = await sql`
    SELECT model, dimensions, count(*) AS cnt
    FROM knowledge.embeddings
    GROUP BY model, dimensions
  `;
  console.log("\nBy model and dimensions:");
  for (const a of agg) {
    const ok = a.dimensions === EXPECTED_DIMENSIONS && (!EXPECTED_MODEL || a.model === EXPECTED_MODEL);
    console.log(`  model=${a.model} dimensions=${a.dimensions} count=${a.cnt} ${ok ? "OK" : "MISMATCH"}`);
    if (!ok) allOk = false;
  }

  if (allOk) {
    console.log("\nOK: All checked embeddings are compatible (dimensions 768, model gemini-embedding-001).");
  } else {
    console.error("\nFAIL: Some embeddings have wrong dimensions or model. Search API expects 768 and gemini-embedding-001.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
