## Why

The knowledge substrate now supports semantic search via pgvector embeddings (`knowledge.match_documents`), but lacks keyword/full-text search. Users searching for specific terms (e.g. "Bilbao flood protection", a country name, or an exact phrase from a case study) get results ranked only by semantic similarity, which can miss exact matches or rank them lower than contextually-related-but-different documents. Combining keyword search (tsvector) with semantic search (pgvector) via Reciprocal Ranked Fusion (RRF) — following the [Supabase hybrid search pattern](https://supabase.com/docs/guides/ai/hybrid-search) — gives the best of both worlds: exact keyword hits are prioritized while semantically similar results fill in the gaps.

## What Changes

- **Add a `fts` tsvector column** to `knowledge.fulltext` with a trigger that auto-computes it on INSERT/UPDATE using language-aware text search configurations (`'english'` for `en`, `'spanish'` for `es`, `'simple'` as fallback).
- **Add a GIN index** on the new `fts` column for fast full-text search.
- **New `knowledge.keyword_search` SQL function** — standalone keyword search over `knowledge.fulltext` using `websearch_to_tsquery`, returning ranked documents with `ts_rank_cd` scores.
- **New `knowledge.hybrid_search` SQL function** — combines keyword search and semantic search using Reciprocal Ranked Fusion (RRF) with configurable weights for each method and a smoothing constant `k`. Accepts a query text, a query embedding, match count, language filter, and weight parameters. Returns ranked documents.
- **Backfill existing rows** — the trigger will compute `fts` for new inserts, but existing rows in `knowledge.fulltext` need a one-time UPDATE to populate the column.
- **Update `create-tables.ts`** to include the new migration files in the execution order.

## Capabilities

### New Capabilities

- `keyword-search`: Full-text search (tsvector/GIN) on `knowledge.fulltext` with language-aware indexing, standalone `keyword_search` RPC function, and the trigger/index infrastructure.
- `hybrid-search`: Reciprocal Ranked Fusion function that combines keyword search and semantic search results into a single ranked list, with configurable weights and smoothing constant.

### Modified Capabilities

- `vector-search`: The existing `match_documents` function is NOT changing, but the `knowledge.fulltext` table gains a new column (`fts`) and index. The `hybrid_search` function internally queries both `fulltext` and `embeddings` tables.

## Impact

- **Database**: New `fts` column + GIN index on `knowledge.fulltext`, new trigger function, two new RPC functions. All additive — existing tables, functions, and `public` schema untouched.
- **SQL files**: New migration files in `packages/db/sql/` (tsvector column + trigger + GIN index, keyword_search function, hybrid_search function).
- **Affected code**: `packages/db/src/create-tables.ts` updated to run new SQL files. No changes to `push-climate-adapt.ts` — the trigger handles tsvector computation automatically on upsert.
- **No new dependencies**: All functionality is native Postgres (tsvector, GIN, websearch_to_tsquery).
- **Scope**: Backend/pipeline only. Frontend integration (search UI, API routes) is a separate change.
