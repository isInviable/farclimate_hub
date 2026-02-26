## 1. SQL Migrations

- [x] 1.1 Create `packages/db/sql/05_enable_vector.sql` — enable the `vector` (pgvector) extension: `CREATE EXTENSION IF NOT EXISTS vector`
- [x] 1.2 Create `packages/db/sql/06_create_embeddings.sql` — create `knowledge.embeddings` table with columns: `id` (UUID PK), `document_id` (FK → documents, CASCADE), `lang` (TEXT NOT NULL), `content_type` (TEXT NOT NULL), `model` (TEXT NOT NULL), `dimensions` (INTEGER NOT NULL), `embedding` (vector(768)); UNIQUE on `(document_id, lang, content_type)`
- [x] 1.3 Add IVFFlat index on `embedding` column in the same SQL file: `CREATE INDEX ... USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10)`
- [x] 1.4 Create `packages/db/sql/07_match_documents_fn.sql` — the `knowledge.match_documents` RPC function that takes `query_embedding vector(768)`, `match_count int`, `filter_lang text`, `filter_content_type text` and returns `(id, document_uid, title, similarity)` ordered by cosine similarity desc
- [x] 1.5 Update `packages/db/src/create-tables.ts` to include the three new SQL files (05, 06, 07) in the execution order

## 2. Gemini Embedding Client

- [x] 2.1 Add `@google/genai` dependency to `packages/db/package.json` and run `npm install`
- [x] 2.2 Create `packages/db/src/embed.ts` — a reusable module that exports: `computeEmbedding(text: string): Promise<number[]>` which calls Gemini `gemini-embedding-001` with `taskType: RETRIEVAL_DOCUMENT` and `outputDimensionality: 768`; reads model/dimensions from env vars `GEMINI_EMBEDDING_MODEL` / `GEMINI_EMBEDDING_DIMENSIONS` with defaults
- [x] 2.3 Implement embedding cache in `embed.ts`: load/save `pipeline/caches/embeddings_cache.json`, key = `sha256(model + ":" + dimensions + ":" + text)`, check cache before API call, write on miss
- [x] 2.4 Export a helper `composeEmbeddingText(title, summary, fulltext): string` that builds the composed text (title + summary + truncated fulltext at 6000 chars), returning empty string if all inputs are empty

## 3. Integrate Embeddings into Push Script

- [x] 3.1 Import `computeEmbedding` and `composeEmbeddingText` into `push-climate-adapt.ts`
- [x] 3.2 Add `upsertEmbedding(documentId, lang, contentType, model, dimensions, embedding)` function that upserts into `knowledge.embeddings` with ON CONFLICT DO UPDATE
- [x] 3.3 In the EN file processing loop (after `upsertFulltext`), compose the embedding text, call `computeEmbedding`, and call `upsertEmbedding` with `lang='en'`, `content_type='composed'`
- [x] 3.4 Skip embedding if the composed text is empty (log a warning)
- [x] 3.5 Add a progress log for each embedding: `[EMB] document_uid -> computed` or `[EMB] document_uid -> cached`

## 4. Standalone Embedding Script

- [x] 4.1 Create `packages/db/src/generate-embeddings.ts` — reads all documents from `knowledge.documents`, fetches their title from `knowledge.summary_multilang` (lang=en), summary from `knowledge.summary_multilang` (lang=en), and fulltext from `knowledge.fulltext` (lang=en), composes text, computes embeddings, and upserts into `knowledge.embeddings`
- [x] 4.2 Add `"db:embed": "tsx src/generate-embeddings.ts"` to `packages/db/package.json` scripts

## 5. Apply Migration to Live Database

- [x] 5.1 Run `db:create` (or use Supabase MCP `apply_migration`) to create the new tables, index, and function on the live Supabase database
- [x] 5.2 Run `db:push` to push data and generate embeddings for all existing documents
- [x] 5.3 Verify embeddings exist by running `SELECT count(*) FROM knowledge.embeddings` and `SELECT document_uid, similarity FROM knowledge.match_documents(...)` with a sample vector

## 6. Verification

- [x] 6.1 Confirm `knowledge.embeddings` has one row per EN document (count matches documents count)
- [x] 6.2 Confirm the `match_documents` function returns ranked results when called with the embedding of an existing document
- [x] 6.3 Confirm `db:drop` and `db:truncate` correctly clean up embeddings (cascade behavior)
- [x] 6.4 Confirm `db:embed` works standalone (re-generates all embeddings from DB content)
- [x] 6.5 Confirm embedding cache at `pipeline/caches/embeddings_cache.json` is populated and prevents redundant API calls on re-runs
