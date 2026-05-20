## Context

`packages/db/sql/04_search_functions.sql` defines `knowledge.hybrid_search(...)` with a `match_threshold float DEFAULT 0.0` parameter (introduced when we adopted the Supabase `match_documents` semantic threshold pattern). The PostgREST-facing wrapper `public.hybrid_search` in `packages/db/sql/06_public_api.sql`, however, was never updated — its signature still ends at `rrf_k int DEFAULT 50`.

`apps/web/server/api/search.ts` calls the wrapper through Supabase's RPC client with the full named-parameter set including `match_threshold`. PostgREST resolves overloads by named-parameter signature, so it cannot find a match and returns `PGRST202`. The handler logs `[search] hybrid_search RPC failed, falling back to keyword` and serves keyword-only results — silently degrading every hybrid search.

## Goals / Non-Goals

**Goals:**
- Restore working hybrid search for all queries by aligning the public wrapper signature with the underlying knowledge function and the API call.
- Keep the schema migration idempotent: re-running `db:push` on existing environments must succeed (the prior 8-arg signature must be dropped before recreating).

**Non-Goals:**
- Changing the RRF formula, weights, or default tuning values.
- Changing the API request/response contract — `match_threshold` is already documented in `search-api`.
- Touching the underlying `knowledge.hybrid_search` function (already correct).

## Decisions

**Add `match_threshold float DEFAULT 0.0` to `public.hybrid_search` and forward it.** PostgREST overload resolution is signature-based, and Supabase's JS client builds the RPC call from the JS object's keys. Adding the parameter (with the same default the API uses) is the minimal change that lets the existing API call resolve.

- Alternative considered: drop `match_threshold` from the API call. Rejected — `search-api` spec explicitly requires this parameter to be passed through to the RPC, and we want the semantic-threshold filter at the DB level for performance.
- Alternative considered: rely on PostgREST tolerating extra params. Rejected — PostgREST does not, hence the current PGRST202.

**Update the `DROP FUNCTION IF EXISTS` line at the top of `06_public_api.sql` to also cover the new 9-arg signature** (`text, text, int, text, text, float, float, int, float`). `CREATE OR REPLACE FUNCTION` cannot change a function's argument list, so existing deployments need an explicit drop of both the old 8-arg form and the new 9-arg form (the latter for forward compatibility when iterating). We keep the existing 8-arg drop too so older environments still upgrade cleanly.

## Risks / Trade-offs

- **Risk**: PostgREST schema cache is stale after the migration → wrapper still appears missing.
  - **Mitigation**: Supabase auto-reloads on DDL, but if needed we can issue `NOTIFY pgrst, 'reload schema';` or restart PostgREST. Document in tasks.
- **Risk**: A caller using positional arguments to the old 8-arg wrapper would break.
  - **Mitigation**: The only caller is our API route, which uses named parameters. No positional callers exist in the codebase.

## Migration Plan

1. Edit `packages/db/sql/06_public_api.sql` (DROP + recreated wrapper).
2. Run `pnpm --filter @farclimate/db push` (or the project's standard push command) against the target Supabase project to re-apply `06_public_api.sql`.
3. Smoke-test: `POST /api/search` with `{ "query": "fishery", "lang": "en", "limit": 60 }` and confirm the dev server log no longer prints the PGRST202 fallback warning, and that response hits include both `keyword_rank` and `semantic_rank` populated for at least some documents (visible via `debug: true`).
4. **Rollback**: revert `06_public_api.sql` and re-push; the API will fall back to keyword-only as it does today (no data loss).
