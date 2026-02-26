## Context

The `knowledge` schema currently has five tables: `documents`, `summary`, `summary_multilang`, `fulltext`, and `embeddings`. Semantic search works via `knowledge.match_documents` which queries pgvector embeddings using cosine distance. The `fulltext` table stores plain text per `(document_id, lang)` but has no full-text search infrastructure (no tsvector, no GIN index).

The `push-climate-adapt.ts` script upserts text into `knowledge.fulltext` via simple INSERT/ON CONFLICT. Any tsvector computation needs to happen either in the push script or automatically via a Postgres trigger.

The [Supabase hybrid search reference](https://supabase.com/docs/guides/ai/hybrid-search) demonstrates the pattern: a `tsvector` column with GIN index for keyword search, plus a `vector` column with an ANN index for semantic search, fused via Reciprocal Ranked Fusion (RRF).

**Key difference from the reference**: Our architecture separates fulltext and embeddings into different tables (`knowledge.fulltext` and `knowledge.embeddings`), while the reference puts everything in one table. The hybrid search function needs to join across both tables on `document_id`.

**Scope**: Backend/pipeline only. No frontend changes.

## Goals / Non-Goals

**Goals:**
- Add full-text search (keyword search) capability to the knowledge substrate.
- Add a hybrid search function that combines keyword + semantic search using RRF.
- Support language-aware tsvector configurations (English, Spanish, extensible).
- Auto-compute tsvector via a Postgres trigger so the push script needs no changes.
- Keep the existing `match_documents` function untouched for pure semantic search use cases.

**Non-Goals:**
- Frontend search UI, API routes, or Supabase Edge Functions (separate change).
- Changing the push script (`push-climate-adapt.ts`) — the trigger handles tsvector computation.
- Language detection or dynamic language resolution — we use the `lang` column already stored in `fulltext`.
- Full-text search over `summary_multilang` fields (title, subtitle, summary) — only `fulltext.fulltext` is indexed for now. Can be extended later.

## Decisions

### 1. tsvector computation: Postgres trigger (not generated column, not app-side)

**Choice:** A trigger function `knowledge.fulltext_fts_trigger()` that fires BEFORE INSERT OR UPDATE on `knowledge.fulltext`, computing `NEW.fts = to_tsvector(config, NEW.fulltext)` where `config` is derived from `NEW.lang`.

**Alternatives considered:**
- **Generated column** (`fts tsvector GENERATED ALWAYS AS ...`): Cannot use because (a) `to_tsvector(regconfig, text)` is STABLE not IMMUTABLE, which Postgres requires for generated columns, and (b) we need to choose the text search config dynamically based on the `lang` column, which is not possible in a single generated expression.
- **App-side computation** (compute in `push-climate-adapt.ts`): Would require the push script to know about text search configs and would add tsvector serialization complexity. Trigger is cleaner — the DB handles its own indexing.

**Rationale:** Trigger is transparent to the application. Any INSERT or UPDATE to `fulltext` automatically gets a tsvector. Language mapping lives in one place (the trigger function), making it easy to add new languages.

### 2. Language mapping: explicit CASE with 'simple' fallback

**Choice:** The trigger maps `lang` to Postgres text search configs:
- `'en'` → `'english'`
- `'es'` → `'spanish'`
- anything else → `'simple'`

**Rationale:** Only two languages currently exist in the data. `'simple'` is a safe fallback that tokenizes without stemming. New languages can be added by extending the CASE expression in the trigger function.

### 3. Hybrid search: RRF fusion across two tables

**Choice:** A `knowledge.hybrid_search` function that:
1. Runs full-text search on `knowledge.fulltext` (WHERE `fts @@ websearch_to_tsquery(...)`)
2. Runs semantic search on `knowledge.embeddings` (ORDER BY `embedding <=> query_embedding`)
3. Joins results via FULL OUTER JOIN on `document_id`
4. Scores each document via RRF: `coalesce(1/(k + keyword_rank), 0) * keyword_weight + coalesce(1/(k + semantic_rank), 0) * semantic_weight`
5. Returns top-N documents ordered by combined score.

**Parameters:**
- `query_text text` — the user's search string (for keyword search)
- `query_embedding vector(768)` — the embedding of the user's query (for semantic search)
- `match_count int DEFAULT 10`
- `filter_lang text DEFAULT 'en'`
- `filter_content_type text DEFAULT 'composed'`
- `full_text_weight float DEFAULT 1` — weight for keyword results
- `semantic_weight float DEFAULT 1` — weight for semantic results
- `rrf_k int DEFAULT 50` — RRF smoothing constant

**Return type:** `TABLE (id uuid, document_uid text, title text, score float, keyword_rank int, semantic_rank int)`

Including both individual ranks alongside the fused score allows the frontend to show debugging info or re-rank client-side if needed.

**Alternatives considered:**
- Combining into a single CTE without fusion: Simpler but doesn't balance the two signals.
- Using `ts_rank` instead of `ts_rank_cd`: `ts_rank_cd` (cover density) tends to produce better rankings for natural language queries.

### 4. Standalone keyword_search function

**Choice:** Also provide `knowledge.keyword_search` as a standalone function so keyword-only search is available without requiring an embedding.

**Rationale:** Useful for simple lookups (e.g. autocomplete, exact-match filtering). The frontend might want keyword-only search for some UI flows. Low cost to add alongside hybrid search.

### 5. GIN index on fts column

**Choice:** Standard GIN index on `knowledge.fulltext.fts`.

**Rationale:** GIN is the standard index type for tsvector columns. No alternatives needed — it's the only practical choice for full-text search indexing.

### 6. Backfill strategy: single UPDATE statement

**Choice:** A one-time `UPDATE knowledge.fulltext SET fulltext = fulltext` which triggers the BEFORE UPDATE trigger and populates `fts` for all existing rows.

**Rationale:** The trigger handles the actual computation. We just need to "touch" each row. This can be run as part of the migration or as a manual step after applying the migration.

## Risks / Trade-offs

- **[tsvector language accuracy]** → The `lang` column is set during ingestion and assumed correct. If a document's language is mislabeled, its tsvector will use the wrong stemmer. Mitigation: The `'simple'` fallback is safe for unknown languages; existing data has been validated.

- **[Query text vs. embedding mismatch]** → The hybrid function assumes `query_text` and `query_embedding` represent the same user query. If the caller passes mismatched text/embedding, results will be incoherent. Mitigation: The frontend should always generate both from the same user input.

- **[RRF weight tuning]** → Default weights (1:1) may not be optimal for all query types. Exact lookups might benefit from higher keyword weight; exploratory queries from higher semantic weight. Mitigation: Weights are configurable per-call. Can tune defaults later based on usage data.

- **[No tsvector on summary fields]** → Only `fulltext.fulltext` is indexed. Title/subtitle/summary in `summary_multilang` are not searchable via keyword search. Mitigation: Fulltext already contains the complete document text including title and section headings. Can add tsvector to summary_multilang later if needed.
