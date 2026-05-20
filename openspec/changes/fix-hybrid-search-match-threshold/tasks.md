## 1. SQL wrapper fix

- [ ] 1.1 In `packages/db/sql/06_public_api.sql`, extend the `DROP FUNCTION IF EXISTS public.hybrid_search(...)` line to drop both the existing 8-arg signature `(text, text, int, text, text, float, float, int)` and the new 9-arg signature `(text, text, int, text, text, float, float, int, float)`
- [ ] 1.2 Add `match_threshold float DEFAULT 0.0` as the last parameter of `public.hybrid_search` and forward it to `knowledge.hybrid_search` in the inner `SELECT * FROM ...` call
- [ ] 1.3 Verify (`Read`) the file compiles mentally end-to-end: parameter list, body, and DROP statement all reference the new arity

## 2. Apply migration

- [ ] 2.1 Run the project's standard DB push to re-apply `06_public_api.sql` against the active Supabase project (e.g. `pnpm --filter @farclimate/db push` or the equivalent script defined in `packages/db/package.json`)
- [ ] 2.2 Confirm the push exits 0; if PostgREST schema cache appears stale, issue `NOTIFY pgrst, 'reload schema';` via the Supabase SQL editor

## 3. Verify in dev

- [ ] 3.1 With the Nuxt dev server running, POST `{ "query": "fishery", "lang": "en", "limit": 60 }` to `/api/search` and confirm the dev server log no longer prints `[search] hybrid_search RPC failed, falling back to keyword`
- [ ] 3.2 POST `{ "query": "fishery", "lang": "en", "limit": 5, "debug": true }` and confirm the response `debug.mode === 'hybrid'` and at least one hit has both `keyword_rank` and `semantic_rank` populated
- [ ] 3.3 Smoke-test one Spanish query (e.g. `{ "query": "pesca", "lang": "es", "limit": 5, "debug": true }`) to confirm language pass-through still works
