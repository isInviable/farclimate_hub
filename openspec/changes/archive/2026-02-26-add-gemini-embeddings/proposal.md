## Why

The knowledge substrate in Supabase currently supports only exact-match and faceted filtering (keywords, sectors, climate impacts, etc.). To enable semantic search — finding relevant case studies based on meaning rather than exact keyword matches — we need vector embeddings stored alongside the documents. Google Gemini's `gemini-embedding-001` model provides high-quality multilingual embeddings at low cost ($0.15/1M tokens), with configurable dimensionality and native multilingual support, making it a natural fit given the project already uses Gemini for augmentation and translation.

## What Changes

- **New `knowledge.embeddings` table** in the Supabase `knowledge` schema with a `vector` column (pgvector), linking to `knowledge.documents` via `document_id` and keyed by `(document_id, lang, content_type)` to support multiple embedding variants (e.g. summary-only vs. fulltext).
- **Enable the `vector` extension** (pgvector) in Supabase via a new SQL migration.
- **New embedding generation step** in the `packages/db` Node.js package that calls the Gemini Embedding API (`gemini-embedding-001`) during the database push (`push-climate-adapt.ts`) to compute embeddings from a composed text (title + summary + truncated fulltext) per document.
- **Embedding cache** in `pipeline/caches/` to avoid redundant API calls on re-runs, keyed by content hash + model + dimensions.
- **Vector similarity search SQL function** (`knowledge.match_documents`) that accepts an embedding vector and returns the top-N most similar documents using cosine distance.
- **New npm script** `db:embed` to regenerate embeddings independently (e.g. after changing the model or dimensions) without re-pushing all document data.
- **Update `push-climate-adapt.ts`** to also compute and upsert embeddings during the regular push flow.

## Capabilities

### New Capabilities

- `embedding-generation`: Compute text embeddings via Google Gemini Embedding API (`gemini-embedding-001`), with caching, configurable dimensions (768/1536/3072), and a composed text strategy (title + summary + fulltext).
- `vector-search`: pgvector-backed similarity search function in Supabase that accepts an embedding and returns ranked documents. Includes the SQL migration for the `vector` extension, the `knowledge.embeddings` table, IVFFlat index, and the `match_documents` RPC function.

### Modified Capabilities

(none — no existing specs to modify)

## Impact

- **Database**: New `knowledge.embeddings` table, pgvector extension enabled, new index and RPC function. All additive — existing tables and `public` schema untouched.
- **Dependencies**: `@google/genai` (or `google-genai` for Node.js) added to `packages/db/package.json` for calling the Gemini Embedding API.
- **Environment**: `GEMINI_API_KEY` must be available in `.env` (already used by the Python augmentation pipeline).
- **Pipeline**: Embedding generation runs after augmentation, during the DB push step. Can also run standalone via `db:embed`.
- **Affected code**: `packages/db/src/push-climate-adapt.ts` (adds embedding upsert call), new files in `packages/db/sql/` and `packages/db/src/`.
