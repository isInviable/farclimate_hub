## ADDED Requirements

### Requirement: Public PostgREST wrapper for hybrid_search

The system SHALL expose a `public.hybrid_search` SQL function that delegates to `knowledge.hybrid_search` so it is reachable via PostgREST/Supabase RPC. The wrapper SHALL accept the same parameters as the underlying function — including `match_threshold float DEFAULT 0.0` — and SHALL forward every parameter unchanged. The `query_embedding` parameter on the wrapper SHALL be typed as `text` and cast to `vector(768)` before being passed to `knowledge.hybrid_search`, so JS callers can send the embedding as a vector literal string.

#### Scenario: RPC call with match_threshold succeeds

- **WHEN** a client invokes `supabase.rpc('hybrid_search', { query_text, query_embedding, match_count, filter_lang, filter_content_type, full_text_weight, semantic_weight, rrf_k, match_threshold })` against the deployed Supabase project
- **THEN** PostgREST SHALL resolve the call to `public.hybrid_search` (no `PGRST202` "function not found" error) and return the same row shape as `knowledge.hybrid_search`

#### Scenario: Default match_threshold is 0

- **WHEN** the wrapper is called without `match_threshold`
- **THEN** it SHALL forward `0.0` to `knowledge.hybrid_search`, preserving the "no semantic distance filtering" behavior

#### Scenario: Migration is idempotent

- **WHEN** `packages/db/sql/06_public_api.sql` is re-applied on an environment where a previous (smaller-arity) `public.hybrid_search` already exists
- **THEN** the migration SHALL drop the prior signature(s) before recreating the wrapper, so the push completes without "cannot change return type" or "function already exists with different signature" errors
