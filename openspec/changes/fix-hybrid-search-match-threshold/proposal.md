## Why

Every hybrid search request currently fails at the RPC layer and silently falls back to keyword-only search. The API route in `apps/web/server/api/search.ts` passes `match_threshold` to `supabase.rpc('hybrid_search', ...)`, but the `public.hybrid_search` PostgREST wrapper in `packages/db/sql/06_public_api.sql` was never updated to accept or forward that parameter. PostgREST therefore reports `PGRST202` ("Could not find the function public.hybrid_search(... match_threshold ...) in the schema cache") and the user loses the semantic half of the ranking — including for plain queries like `{ "query": "fishery", "lang": "en", "limit": 60 }` with no other filters.

## What Changes

- Update the `public.hybrid_search` SQL wrapper to accept `match_threshold float DEFAULT 0.0` and forward it to `knowledge.hybrid_search`.
- Update the `DROP FUNCTION IF EXISTS` statement at the top of `06_public_api.sql` so re-applying the migration drops both the old (8-arg) and any intermediate signatures cleanly.
- Re-apply the SQL on the Supabase project so the schema cache picks up the new signature.
- Verify (via `supabase.rpc('hybrid_search', { ..., match_threshold: 0.0 })`) that the simple-query case returns hybrid results with both `keyword_rank` and `semantic_rank` populated.

No spec requirement changes — `hybrid-search` and `search-api` already mandate the `match_threshold` plumbing; this is an implementation alignment fix in the wrapper.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
<!-- No requirement changes; only implementation alignment between the wrapper and existing specs. -->

## Impact

- **DB**: `packages/db/sql/06_public_api.sql` — wrapper signature gains `match_threshold`; `DROP` statement updated to cover prior signatures.
- **Supabase project**: must re-run `pnpm --filter @farclimate/db push` (or equivalent) so PostgREST refreshes its schema cache with the new function signature.
- **API**: `apps/web/server/api/search.ts` — no code change needed; the existing call already supplies `match_threshold`.
- **Behavior**: `POST /api/search` regains true hybrid ranking for all queries (currently degraded to keyword-only). No breaking change for clients.
