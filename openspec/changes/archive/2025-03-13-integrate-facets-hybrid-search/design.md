## Context

- **Hybrid search**: `POST /api/search` calls `knowledge.hybrid_search` (or `keyword_search` fallback), then fetches full documents via `get_documents_by_ids`. No facet filtering today.
- **Facets**: `POST /api/facets` and RPC `get_filter_facets(doc_ids)` return `global` and `for_result_set` counts for `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords` from `knowledge.summary`. Already indexed and working.
- **Explorer filters**: `FilterManager` composes `SearchFilter`, `SectorFilter`, `HazardsFilter`, `TimeFilter`. Sector and Hazards use hardcoded items and fake counts; applying a filter does not narrow results. TimeFilter is separate (implementation years); this change focuses on the four facet categories above.

## Goals / Non-Goals

**Goals:**

- Backend: Accept optional facet filter params in `POST /api/search` and return only documents that match the selected facet values (AND across categories, OR within each category).
- Frontend: After each search/load, fetch facets with current hit IDs; feed real options and counts to filter components; when user applies facet filters, call search with those params and show narrowed results so the filter UI is functional.

**Non-Goals:**

- Changing the contract of `POST /api/facets` or `get_filter_facets`.
- TimeFilter / implementation years filtering in this change (can be added later using the same pattern).
- Replacing or rewriting the existing filter components’ UI; only their data source and the search flow are wired to real APIs.

## Decisions

### 1. Where to apply facet filtering

- **Option A**: Extend `knowledge.hybrid_search` (and optionally `keyword_search`) to accept optional array params (e.g. `filter_sectors text[]`, `filter_climate_impacts text[]`) and restrict the result set in SQL (JOIN with `knowledge.summary` and `WHERE` overlap with selected values). Pro: single round-trip, correct limit semantics. Con: more SQL surface and migration.
- **Option B**: Keep RPCs unchanged; in `search.ts`, after obtaining candidate ids from hybrid/keyword search, call a small RPC or query that returns only those ids that satisfy the facet constraints (using `knowledge.summary`), then slice to `limit` and fetch full docs. Pro: no change to hybrid_search signature. Con: possible over-fetch if many candidates are filtered out; may need to request more than `limit` from the search RPC when facets are present.

**Decision**: Prefer **Option B** for the first iteration: apply facet filtering in the API layer. Request a larger candidate set from the search RPC when facet params are present (e.g. `match_count = limit * 3` or configurable), then filter by facets in Node, then take the first `limit` and fetch full documents. If in practice too many results are discarded, we can add Option A (extend RPC) in a follow-up.

### 2. Facet filter semantics

- **AND across categories**: If the user selects "Agriculture" (sectors) and "Drought" (climate_impacts), return only documents that have at least one of the selected sectors **and** at least one of the selected climate_impacts.
- **OR within a category**: If the user selects "Agriculture" and "Forestry", return documents that have **either** (or both).

**Decision**: Implement AND across categories, OR within each category. Aligns with common faceted search UIs and with the existing facet categories in `get_filter_facets`.

### 3. Request body shape for facet params

- **Decision**: Add four optional arrays to the JSON body of `POST /api/search`: `sectors?: string[]`, `climate_impacts?: string[]`, `adaptation_approaches?: string[]`, `keywords?: string[]`. Omitted or empty array = no filter for that category. Values must match the facet `value` strings returned by `get_filter_facets` (e.g. exact match or normalized as in the DB).

### 4. Frontend: when to fetch facets and when to search with filters

- After every successful search or "load all", the client has a new set of hit IDs. Fetch facets with `doc_ids = hit IDs` so that "for result set" counts reflect the current result set; use the same response for "global" counts.
- When the user applies one or more facet filters (e.g. selects sectors and/or hazards), the client sends the current search query (or empty for load all) **plus** the selected facet arrays to `POST /api/search`, then replaces the current results with the response and, on success, fetches facets again with the new hit IDs so the filter bars update.

**Decision**: Fetch facets after each search/load; when applying filters, perform a new search request including the selected facet values, then refetch facets with the new result set. No need to maintain a separate "global-only" facets call if the first load is done with empty `doc_ids` or with the initial result set; the UI can show global from the first response and for_result_set from the latest.

### 5. Mapping UI filter keys to API facet categories

- **Sector** → `sectors`
- **Hazards** (climate hazards) → `climate_impacts`
- **Adaptation approaches** and **Keywords** → same names in the API. If the UI does not yet expose adaptation_approaches or keywords as filters, the backend still accepts them; the frontend can add dropdowns/chips later driven by the same facets response.

**Decision**: Use the above mapping. Rename or alias "Hazards" to "Climate impacts" in the UI if desired for consistency with the data model.

### 6. Only active filters sent (effective filters)

When the user disables a filter (e.g. unchecks the Sector filter), that filter’s values must not be sent in the request. The FilterManager emits only **effective** filters: it includes in the payload only keys for filters that are currently enabled. So when building the search body, the client only adds `sectors`, `climate_impacts`, etc. when the corresponding filter is active; omitted keys mean “no restriction” for the API.

**Decision**: FilterManager emits `filters-changed` with an object that contains only keys for enabled filters (`getEffectiveFilters()`). The parent (explorer) derives facet params from that object; missing keys yield empty arrays and are not sent to `POST /api/search`.

### 7. Dual stacked bars per facet option

Each facet option (e.g. a sector or climate impact) is shown with two bars on the same row and scale: (1) total/max count (how many items in the corpus have that value; from `global`), (2) current result set count (how many of those appear in the current search results; from `for_result_set`). The total bar is fixed; the current bar updates when the result set changes. Optionally show "current / total" (e.g. "6 / 14") next to each option.

**Decision**: BarChartFilter accepts optional `countsGlobal`; when present, it renders the total bar (e.g. light grey) and the current bar (e.g. darker) so the user sees how much of each facet is in the current view.

## Risks / Trade-offs

- **[Over-fetch when facets are strict]** If many candidates are discarded by the facet filter, the user might get fewer than `limit` results even though more matching docs exist. **Mitigation**: Request a larger candidate set (e.g. 2–3× limit) when facet params are present; document the behaviour; consider moving filtering into the RPC later if needed.
- **[Stale facet counts]** If data changes between search and facet fetch, counts can be briefly inconsistent. **Mitigation**: Acceptable for current scope; refetch facets after each search so the UI is consistent with the last result set.
- **[Empty result set]** Selecting facets that no document has will return 0 hits. **Mitigation**: Normal UX; show "No results" and allow user to clear filters.

## Migration Plan

- Backend: Deploy new `search.ts` that reads optional facet params and applies filtering (and optionally requests a larger candidate set). No DB migration required if using Option B.
- Frontend: Deploy updated filter components and search/facets flow; no breaking change to existing search-only usage (facet params optional).
- Rollback: Revert to previous `search.ts` and frontend; no data migration to undo.

## Open Questions

- Whether to add a small RPC `filter_document_ids_by_facets(doc_ids uuid[], sectors text[], ...)` that returns the subset of `doc_ids` satisfying the facet constraints, to keep the filtering logic in one place and avoid ad-hoc SQL in the API. Optional follow-up.
