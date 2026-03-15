## ADDED Requirements

### Requirement: Facets fetched after search or load all

The explorer SHALL request filter facets from `POST /api/facets` with the current result set document IDs whenever a search or "load all" completes successfully. The request body SHALL include `doc_ids` set to the array of hit IDs from the latest search response, so that the response contains both `global` and `for_result_set` facet counts.

#### Scenario: Facets requested after search
- **WHEN** the user performs a hybrid or keyword search and the endpoint returns a non-empty `hits` array
- **THEN** the client SHALL call `POST /api/facets` with `doc_ids` equal to the list of hit `id` values and SHALL use the response to drive filter options and counts

#### Scenario: Facets requested after load all
- **WHEN** the user triggers load all (empty query) and receives the full document list
- **THEN** the client SHALL call `POST /api/facets` with `doc_ids` equal to the returned document IDs and SHALL use the response for filter data

#### Scenario: No results
- **WHEN** a search returns zero hits
- **THEN** the client MAY call `POST /api/facets` with empty `doc_ids` or omit the request; if called with empty or no `doc_ids`, `for_result_set` SHALL be empty arrays and the UI SHALL show global counts only or disable result-set counts

### Requirement: Filter components use real facet data

The Sector, Hazards (climate impacts), and any Adaptation approaches or Keywords filter components SHALL be driven by the facets API response. Options (values) and counts SHALL come from the `global` and `for_result_set` structures returned by `POST /api/facets`, not from hardcoded lists. The mapping SHALL be: Sector → `sectors`, Hazards → `climate_impacts`, Adaptation approaches → `adaptation_approaches`, Keywords → `keywords`.

#### Scenario: Sector filter shows API-driven options
- **WHEN** facets have been fetched and the response includes `global.sectors` and `for_result_set.sectors`
- **THEN** the Sector filter component SHALL display options and counts from that data (e.g. value and count per row, with for_result_set count or percentage when available)

#### Scenario: Hazards filter shows API-driven options
- **WHEN** facets have been fetched and the response includes `global.climate_impacts` and `for_result_set.climate_impacts`
- **THEN** the Hazards (climate impacts) filter component SHALL display options and counts from that data

#### Scenario: Dual stacked bars per facet option
- **WHEN** the filter component has both global and for_result_set counts
- **THEN** each facet option SHALL show two stacked bars (same row, same scale): one bar for the total/max count (how many items in the corpus have that facet value) and one bar for the current result set count (how many of those are in the current search results). The total bar SHALL not change with search; only the current bar SHALL update when results change. The UI MAY display the counts as "current / total" (e.g. "6 / 14") for clarity

#### Scenario: Counts update after result set changes
- **WHEN** the user applies a new search or facet filter and the result set changes
- **THEN** the client SHALL refetch facets with the new hit IDs and the filter components SHALL update to show the new for_result_set counts

### Requirement: Only active filters are sent in the query and facets

The client SHALL send facet parameters to `POST /api/search` only for filters that are currently **active** (enabled). When a filter is **inactive** (disabled), the client SHALL NOT include that filter’s values in the request body, regardless of any previous selection. Thus, if the Sector filter is disabled, no `sectors` field SHALL be sent; if the Hazards filter is disabled, no `climate_impacts` field SHALL be sent. This ensures that inactive filters do not restrict the result set.

#### Scenario: Disabled filter not sent
- **WHEN** the user had previously enabled the Sector filter and selected "Agriculture", then disables the Sector filter (without clearing the selection)
- **THEN** the next search or load SHALL be performed without a `sectors` (or equivalent) parameter, and results SHALL not be restricted by sector

#### Scenario: Only enabled filters in request
- **WHEN** the user has Sector filter enabled with selection and Hazards filter disabled
- **THEN** `POST /api/search` SHALL include only `sectors` (and other enabled filter keys), and SHALL NOT include `climate_impacts`

### Requirement: Applying facet filters triggers search with facet params

When the user applies one or more **active** facet filters (e.g. selects one or more sectors and/or climate impacts and the corresponding filter is enabled), the client SHALL perform a new request to `POST /api/search` with the same `query` and `lang` as the current context, plus the selected facet values in the corresponding body fields (`sectors`, `climate_impacts`, `adaptation_approaches`, `keywords`) only for those filters that are active. The client SHALL replace the current result set with the response hits and SHALL refetch facets with the new hit IDs so that the filter UI reflects the narrowed set.

#### Scenario: User selects sector and applies
- **WHEN** the user selects "Agriculture" in the Sector filter and applies (or confirms) the filter
- **THEN** the client SHALL send `POST /api/search` with body including `sectors: ["Agriculture"]` (and current query/lang), and SHALL display the returned hits and update facet counts with a subsequent `POST /api/facets` call using the new hit IDs

#### Scenario: User selects multiple facets and applies
- **WHEN** the user selects one or more sectors and one or more climate impacts and applies
- **THEN** the client SHALL send `POST /api/search` with `sectors` and `climate_impacts` arrays containing the selected values, and SHALL update results and facets as in the previous scenario

#### Scenario: User clears facet filters
- **WHEN** the user clears one or all facet filters
- **THEN** the client SHALL send `POST /api/search` without the cleared categories (or with empty arrays), and SHALL update results and refetch facets with the new hit IDs

### Requirement: Filter state and search context preserved

When sending `POST /api/search` with facet params, the client SHALL preserve the current search query (or empty for load all), language, and limit so that the request reflects the user’s full intent (text search + facet filters). The filter UI SHALL reflect the currently applied facet selections so that the user can add, remove, or change filters and see updated results.

#### Scenario: Search query preserved with facets
- **WHEN** the user had previously searched for "flood" and then applies a sector filter
- **THEN** the next `POST /api/search` request SHALL include both `query: "flood"` and the selected `sectors` (and other facet params if any)

#### Scenario: Applied filters visible in UI
- **WHEN** facet filters have been applied
- **THEN** the filter components SHALL show the current selection (e.g. selected sector(s), hazards) and SHALL allow the user to clear or change them and re-apply
