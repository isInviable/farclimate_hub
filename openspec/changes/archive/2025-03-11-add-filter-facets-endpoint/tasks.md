## 1. Database function (knowledge schema)

- [x] 1.1 Create `packages/db/sql/13_get_filter_facets.sql` with `knowledge.get_filter_facets(doc_ids uuid[] DEFAULT NULL)` that returns a single JSONB: for each of `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords`, compute unique values and counts over the whole table (global) and, when `doc_ids` is not null/empty, over rows where `document_id = ANY(doc_ids)` (for_result_set); each list ordered by count descending
- [x] 1.2 Add `public.get_filter_facets(doc_ids uuid[] DEFAULT NULL)` wrapper in the same file that calls `knowledge.get_filter_facets` and returns the JSONB

## 2. Pipeline integration

- [x] 2.1 Add `"13_get_filter_facets.sql"` to the `runSqlFiles` array in `packages/db/src/create-tables.ts` after `"12_add_gin_indexes.sql"`

## 3. Optional HTTP endpoint

- [x] 3.1 Create `apps/web/server/api/facets.post.ts` (or equivalent) that accepts body `{ doc_ids?: string[] }`, calls `public.get_filter_facets` via Supabase client, and returns the same JSON structure (so the frontend can get facets via `/api/facets` without calling Supabase from the browser if desired)

## 4. Verification

- [x] 4.1 Call `get_filter_facets()` with no args (or null) and verify global facet lists and structure (value, count, order)
- [x] 4.2 Call `get_filter_facets(doc_ids)` with a subset of document IDs and verify both `global` and `for_result_set` are present and result-set counts are ≤ global counts
