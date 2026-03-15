## 1. Backend: Facet filtering in search API

- [x] 1.1 In `server/api/search.ts`, read optional body params `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords` (each string[]); normalize to empty array when omitted or invalid
- [x] 1.2 When any facet param is non-empty, after obtaining candidate ids from hybrid_search/keyword_search/get_all_documents, filter those ids by facet constraints (AND across categories, OR within category) using knowledge.summary data — either via a new RPC `filter_document_ids_by_facets(doc_ids, sectors, climate_impacts, adaptation_approaches, keywords)` or via a Supabase query that returns only ids in the candidate set whose summary row overlaps each provided array
- [x] 1.3 Apply min_score and facet filtering in a single pipeline: take candidate results, filter by min_score, then by facets (when present), then take first `limit` and fetch full documents with get_documents_by_ids
- [x] 1.4 When facet params are present, optionally request a larger candidate set from the search RPC (e.g. limit * 2 or 3) so that after facet filtering enough results remain; document or make configurable if needed
- [x] 1.5 Add or extend TypeScript types for the search request body to include optional `sectors?: string[]`, `climate_impacts?: string[]`, `adaptation_approaches?: string[]`, `keywords?: string[]`

## 2. Backend: RPC or query for facet filtering (if not in-app)

- [ ] 2.1 If implementing filtering in SQL: add a migration that creates a function (e.g. `knowledge.filter_document_ids_by_facets(doc_ids uuid[], filter_sectors text[], filter_climate_impacts text[], filter_adaptation_approaches text[], filter_keywords text[]) returns uuid[]`) that returns the subset of doc_ids whose document_id has a row in knowledge.summary satisfying overlap with each non-empty filter array; call it from search.ts when facet params are present
- [x] 2.2 If implementing filtering in the API layer: in search.ts, after getting candidate ids, fetch summary rows for those ids (e.g. select document_id, sectors, climate_impacts, adaptation_approaches, keywords from knowledge.summary where document_id = any(ids)), then in Node filter ids to those that overlap each provided facet array; keep logic in one place and add unit tests or integration test for facet filtering

## 3. Frontend: Facets composable and store

- [x] 3.1 Create a composable (e.g. `useFacets`) or extend the search composable to fetch facets: `fetchFacets(docIds: string[]) => Promise<FilterFacetsResponse>` calling `$fetch('/api/facets', { method: 'POST', body: { doc_ids: docIds } })`
- [x] 3.2 After every successful search or load-all, call fetchFacets with the current hit IDs and store the result (e.g. in a ref or in the search store) so that filter components can read global and for_result_set
- [x] 3.3 Extend the search composable (e.g. useHybridSearch) to accept optional facet filter state (sectors, climate_impacts, adaptation_approaches, keywords) and to send them in the body when calling POST /api/search; when user applies filters, set this state and trigger search with the same query/lang plus facet params, then refetch facets with the new hit IDs

## 4. Frontend: Filter components driven by facets API

- [x] 4.1 Update SectorFilter to accept facet data (e.g. props or inject from composable/store): options and counts from `global.sectors` and `for_result_set.sectors`; remove hardcoded sectorItems and sectorCounts
- [x] 4.2 Update HazardsFilter to accept facet data from `global.climate_impacts` and `for_result_set.climate_impacts`; remove hardcoded hazardItems and hazardCounts; align label with "Climate impacts" if desired
- [x] 4.3 Wire FilterManager (or parent) so that it passes the stored facets response into SectorFilter and HazardsFilter; ensure components render empty state when facets are not yet loaded or for_result_set is empty
- [x] 4.4 When user selects values and applies (e.g. Apply Filters or filter-apply event), update the search composable’s facet state and trigger search with the selected sectors, climate_impacts, etc.; then refetch facets with the new hit IDs and update the store/ref so filter bars show new counts

## 5. Frontend: Optional adaptation_approaches and keywords filters

- [ ] 5.1 If the UI already has or will add Adaptation approaches / Keywords filters, drive them from `global.adaptation_approaches`, `for_result_set.adaptation_approaches`, and same for keywords; when applied, send adaptation_approaches and keywords in the search request body
- [x] 5.2 If not adding new filter components in this change, ensure the search composable and API still accept adaptation_approaches and keywords so they can be added later without backend changes

## 6. Tests and verification

- [x] 6.1 Add or extend an API test for POST /api/search with facet params: e.g. request with sectors: ["Agriculture"] and assert returned hits only include documents that have "Agriculture" in their summary sectors (or mock DB and assert filtering logic)
- [ ] 6.2 Manually verify: run search, then apply sector and/or hazards filter, confirm result set narrows and facet counts update after refetch
