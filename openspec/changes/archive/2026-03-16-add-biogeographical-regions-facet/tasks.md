# Tasks: Add biogeographical regions facet

## 1. Facet SQL functions (derive from JSONB; no new column)

- [x] 1.1 Add helper or inline SQL to normalize `geographic_characterisation->'biogeographical_regions'` to a list of text values (string → split by comma + trim; JSON array → jsonb_array_elements_text; null/missing → treat as "no-identificados")
- [x] 1.2 Update `knowledge.get_filter_facets` to include `biogeographical_regions` in global and for_result_set: aggregate counts from the derived list, including an entry "no-identificados" for documents with null/empty region data
- [x] 1.3 Update `knowledge.get_summary_facet_arrays` to return a computed `biogeographical_regions` (TEXT[]) per document: normalized region list or `ARRAY['no-identificados']` when null/empty; ensure public wrapper if used

## 2. Backend API (Nuxt)

- [x] 2.1 Add `biogeographical_regions` to facet types: `FacetCategory` and `FilterFacetsResponse` in `apps/web/app/types/facets.ts`
- [x] 2.2 Add `biogeographical_regions` to `SearchFacetParams` in `apps/web/app/types/search.d.ts` (or equivalent)
- [x] 2.3 In `POST /api/search`: parse `biogeographical_regions` from body, include in facetFilters and in `filterIdsByFacets` (extend summary row type to include `biogeographical_regions`; filter logic must handle "no-identificados" when selected)
- [x] 2.4 Ensure `POST /api/facets` passes through the new category from RPC response (no change if RPC returns it and types are updated)

## 3. Frontend: composables and store

- [x] 3.1 In `useHybridSearch.ts`: add `biogeographical_regions` to `facetFilters` and to `buildSearchBody` when non-empty
- [x] 3.2 In explorer page (or wherever filters are synced): include `biogeographical_regions` when applying facet filters (same pattern as sectors/climate_impacts)

## 4. Frontend: filter UI

- [x] 4.1 Create `BiogeographicalRegionsFilter.vue` (or equivalent) reusing BarChartFilter with title "Biogeographical region", filter key `biogeographical_regions`, and props for global/for_result_set facet lists (including "no-identificados" when present)
- [x] 4.2 Add filter key `biogeographical_regions` to FilterManager metadata and render the new filter (active + available sections) with `facetsData?.global?.biogeographical_regions` and for_result_set counts
- [x] 4.3 Wire filter change/clear/apply so selected regions (including "no-identificados") are sent in search and facets are refetched (same as Sector/Hazards)
