## Context

The farclimate knowledge substrate lives in a `knowledge` Postgres schema on Supabase with four tables: `documents`, `summary`, `summary_multilang`, and `fulltext`. Data flows through a multi-stage Python pipeline (fetch HTML → extract JSON → augment with AI → translate), then a TypeScript DB push script (`packages/db/src/push-climate-adapt.ts`) reads the augmented JSON files and upserts into all four tables.

Currently, searching is limited to exact keyword matches and faceted filters on the `summary` table arrays (keywords, sectors, climate_impacts, etc.). There is no semantic/vector search capability.

The project already uses the Google Gemini API for augmentation and translation (via the Python pipeline). The `.env` file already contains `GEMINI_API_KEY`.

**Constraints:**
- The `public` schema and its tables MUST NOT be touched.
- All new tables live in the `knowledge` schema.
- The existing push flow must remain idempotent (upsert-based).
- Supabase's managed Postgres includes the `vector` extension (pgvector) but it needs to be explicitly enabled.

## Goals / Non-Goals

**Goals:**
- Enable vector similarity search over case study documents.
- Generate embeddings using Google Gemini `gemini-embedding-001` model.
- Store embeddings in a dedicated table with pgvector, indexed for fast cosine similarity queries.
- Support embedding multiple content types (summary-only vs. full content) and multiple languages.
- Provide a Postgres RPC function `knowledge.match_documents` for ranked retrieval.
- Cache embedding API calls to avoid redundant costs on re-runs.
- Allow independent re-embedding via a standalone `db:embed` script (for model rotation or dimension changes).

**Non-Goals:**
- Building a search UI or API endpoint (handled by the web app layer, separate change).
- Chunking long documents into multiple embedding segments (document-level embeddings are sufficient for ~200 case studies).
- Per-language embeddings for translations (start with English only; `gemini-embedding-001` is multilingual so English embeddings match Spanish queries reasonably well).
- RAG (retrieval-augmented generation) pipeline — this change only adds the retrieval primitive.
- Hybrid search combining full-text search (tsvector) with vector search (possible future enhancement).

## Decisions

### 1. Embedding model: `gemini-embedding-001`

**Choice:** Google Gemini `gemini-embedding-001` with 768 dimensions.

**Alternatives considered:**
- OpenAI `text-embedding-3-small` (1536 dims): Higher quality for English-only, but adds a second API provider and key. Project already uses Gemini.
- `text-embedding-004` (Gemini legacy): Superseded by `gemini-embedding-001`.
- Full 3072 dimensions: Better recall but significantly more storage and slower index queries. For ~200 documents, 768 is more than sufficient and keeps the index tiny.

**Rationale:** Single API provider (Gemini), native multilingual support, configurable dimensionality. 768 dimensions strikes a balance between quality and efficiency for the current dataset size. Can bump to 1536 later if recall degrades.

### 2. What text to embed

**Choice:** Compose a single text block per document: `title + "\n\n" + summary + "\n\n" + fulltext[:6000]`.

**Alternatives considered:**
- Summary only: Fast and cheap, but loses important detail from the case study body.
- Fulltext only: Good recall but misses the distilled summary and title.
- Separate embeddings for summary and fulltext: More flexible but adds complexity and storage.

**Rationale:** A composed text captures the title (high signal, short), the AI-generated summary (distilled key points), and a substantial portion of the original content. Truncation at 6000 chars keeps us within the model's 2048-token input limit while covering the most semantically dense content.

### 3. Embedding storage: dedicated `knowledge.embeddings` table

**Choice:** A new table `knowledge.embeddings` with columns `(id, document_id, lang, content_type, model, dimensions, embedding)`, keyed by `(document_id, lang, content_type)`.

**Alternatives considered:**
- Adding a `vector` column directly to `knowledge.documents`: Simpler, but conflates identity metadata with derived representations. Violates the architecture principle that documents store identity, not derived content. Also doesn't support per-language or per-content-type variants.
- Adding to `knowledge.fulltext`: Conceptually closer, but fulltext is purely text storage.

**Rationale:** Separate table follows the existing architecture pattern (summary, summary_multilang, fulltext are all separate from documents). Supports future expansion (multiple content types, languages, model versions) via the composite unique key. `ON DELETE CASCADE` from documents keeps cleanup automatic.

### 4. Index type: IVFFlat

**Choice:** IVFFlat index with `lists = 10` (for ~200 documents).

**Alternatives considered:**
- HNSW: Better recall at scale, but more memory and slower builds. Overkill for ~200 docs.
- No index (sequential scan): Works fine for <1000 rows, but adding an index is negligible overhead and future-proofs for scale.

**Rationale:** IVFFlat is lightweight and Supabase-native. With only ~200 documents, even `lists=10` gives excellent recall. Can switch to HNSW if the corpus grows past ~10k.

### 5. Embedding generation: TypeScript in `packages/db`

**Choice:** Call the Gemini Embedding API from TypeScript during the DB push step, using `@google/genai` npm package.

**Alternatives considered:**
- Python script in `pipeline/` (like the augmentation step): Would require a separate execution step and cross-language coordination.
- Supabase Edge Function: Would need API key management in Supabase and doesn't fit the batch pipeline pattern.

**Rationale:** The embedding is a derived representation tied to what goes into the database, so it belongs in the DB push layer. TypeScript is consistent with the existing `packages/db` stack. The `@google/genai` SDK provides direct access to `gemini-embedding-001`.

### 6. Caching strategy: content-hash-based JSON cache

**Choice:** Cache embeddings in `pipeline/caches/embeddings_cache.json`, keyed by `sha256(model + dimensions + content_text)`.

**Rationale:** Same pattern as the Python augmentation caches (geocode, years, preprocess, summary, translation). Content-based hashing ensures cache hits when the same text is re-embedded with the same model, while invalidating when either changes.

### 7. Vector search function: `knowledge.match_documents`

**Choice:** A Postgres function that takes an embedding vector, optional filters (lang, content_type), and a match count, returning documents ordered by cosine similarity.

```sql
CREATE FUNCTION knowledge.match_documents(
  query_embedding vector(768),
  match_count int DEFAULT 10,
  filter_lang text DEFAULT 'en',
  filter_content_type text DEFAULT 'composed'
) RETURNS TABLE (...)
```

**Rationale:** Encapsulates the similarity query in a single RPC call from the Supabase client. The web app can call it via `supabase.rpc('match_documents', {...})` without writing raw SQL. Filtering by lang and content_type allows future flexibility.

## Risks / Trade-offs

- **[Model deprecation]** → Google may deprecate `gemini-embedding-001`. Mitigation: The `model` column in the embeddings table and the cache key include the model name, making model rotation a matter of re-running `db:embed` with a new model env var.

- **[Token limit]** → Gemini embedding has a 2048-token input limit. A 6000-char truncation is approximate (~1500-2000 tokens). Mitigation: If truncation cuts important content, we can lower the char limit or switch to summary-only embedding. Monitor for documents where the embedding misses key content.

- **[Index accuracy at scale]** → IVFFlat with `lists=10` is tuned for ~200 docs. If the corpus grows 100x, accuracy may degrade. Mitigation: Rebuild index with more lists, or switch to HNSW. This is a one-command operation.

- **[Single-language embeddings]** → Starting with English only. Spanish queries will work via the multilingual model but may have slightly lower recall. Mitigation: Add per-language embeddings later by inserting rows with `lang='es'` and embedding the translated text. The table schema already supports this.

- **[Cache size]** → Embedding vectors are large (~768 floats × 4 bytes = ~3KB per doc). For 200 docs the cache is ~600KB — negligible. Would need a different strategy at 100k+ docs.
