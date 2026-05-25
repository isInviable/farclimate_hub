## MODIFIED Requirements

### Requirement: Filter components use real facet data

The Sector, Hazards (climate impacts), Adaptation approaches, and Biogeographical regions filter components SHALL be driven by real facet data. Options and corpus totals SHALL come from corpus metadata `globalFacets`. Current counts SHALL come from `for_result_set` facet data for the current full server-side matching set. The mapping SHALL be: Sector → `sectors`, Hazards → `climate_impacts`, Adaptation approaches → `adaptation_approaches`, Biogeographical regions → `biogeographical_regions`. Keywords SHALL NOT be exposed in the explorer filter interface by this capability.

#### Scenario: Sector filter shows metadata-driven options
- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.sectors`
- **THEN** the Sector filter component SHALL display sector options and corpus total counts from that data

#### Scenario: Hazards filter shows metadata-driven options
- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.climate_impacts`
- **THEN** the Hazards (climate impacts) filter component SHALL display options and corpus total counts from that data

#### Scenario: Adaptation approaches filter shows metadata-driven options
- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.adaptation_approaches`
- **THEN** the Adaptation approaches filter component SHALL display options and corpus total counts from that data

#### Scenario: Biogeographical regions filter shows metadata-driven options
- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.biogeographical_regions`
- **THEN** the Biogeographical regions filter component SHALL display options and corpus totals from that data

#### Scenario: Current over total count per facet option
- **WHEN** the filter component renders a facet option
- **THEN** it SHALL show the current-result-set count in relation to the corpus-wide count for that value, for example `6 / 14`, using dual bars where the corpus total is the background or total bar and the current result-set count is the foreground or current bar

#### Scenario: Overlay counts update after result set changes
- **WHEN** the user applies a new search or facet filter and the result set changes
- **THEN** the current count and foreground bar SHALL update from `for_result_set` counts while the total count and background bar SHALL remain corpus-wide

### Requirement: Only active filters are sent in the query and facets

The client SHALL send facet parameters to the explorer search path only for filters that are currently active and supported by the server-backed explorer filter model. When a filter is inactive, the client SHALL NOT include that filter's values in the request body, regardless of any previous selection. Unsupported leftover filter keys such as `time`, `phases`, and `scales` SHALL NOT be sent and SHALL NOT restrict results.

#### Scenario: Disabled filter not sent
- **WHEN** the user had previously enabled the Sector filter and selected "Agriculture", then disables the Sector filter without clearing the selection
- **THEN** the next search or load SHALL be performed without a `sectors` parameter, and results SHALL not be restricted by sector

#### Scenario: Only enabled filters in request
- **WHEN** the user has Sector filter enabled with selection and Hazards filter disabled
- **THEN** the explorer search request SHALL include only `sectors` and other enabled supported filter keys, and SHALL NOT include `climate_impacts`

#### Scenario: Unsupported leftover filters not sent
- **WHEN** effective filter state contains unsupported keys such as `time`, `phases`, or `scales`
- **THEN** the explorer search request SHALL omit those keys and SHALL not restrict results based on them

### Requirement: Applying facet filters triggers search with facet params

When the user applies one or more active facet filters, the client SHALL perform a new explorer search request with the same query and language as the current context, plus selected values in the corresponding body fields (`sectors`, `climate_impacts`, `adaptation_approaches`, `biogeographical_regions`) only for filters that are active. The client SHALL replace the current page result set with the response hits and use the response facet metadata for result-set counts.

#### Scenario: User selects sector and applies
- **WHEN** the user selects "Agriculture" in the Sector filter and applies or confirms the filter
- **THEN** the client SHALL send an explorer search request with body including `sectors: ["Agriculture"]`, display the returned hits, and update result-set facet counts from the response metadata

#### Scenario: User selects adaptation approach and applies
- **WHEN** the user selects one or more Adaptation approaches and applies the filter
- **THEN** the client SHALL send an explorer search request with body including `adaptation_approaches` set to the selected values, display the returned hits, and update result-set facet counts from the response metadata

#### Scenario: User selects multiple facets and applies
- **WHEN** the user selects one or more sectors, one or more climate impacts, and one or more adaptation approaches and applies
- **THEN** the client SHALL send an explorer search request with `sectors`, `climate_impacts`, and `adaptation_approaches` arrays containing the selected values

#### Scenario: User clears facet filters
- **WHEN** the user clears one or all facet filters
- **THEN** the client SHALL send an explorer search request without the cleared categories, display the returned hits, and update result-set facet counts from the response metadata

### Requirement: Biogeographical regions filter uses real facet data

A Biogeographical regions filter SHALL be available in the explorer. Options and corpus totals SHALL come from `globalFacets.biogeographical_regions`; current counts SHALL come from `for_result_set.biogeographical_regions`. The filter SHALL behave like the Sector, Hazards, and Adaptation approaches filters: same component pattern, only active filters sent in the query, and applying the filter SHALL trigger a search with the selected regions in the request body.

#### Scenario: Biogeographical regions filter shows metadata-driven options
- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.biogeographical_regions`
- **THEN** the Biogeographical regions filter component SHALL display options and corpus totals from that data, with current counts from the latest result-set facets when available

#### Scenario: Biogeographical regions filter uses same apply behaviour as other facets
- **WHEN** the user selects one or more biogeographical regions and applies the filter
- **THEN** the client SHALL send an explorer search request with body including `biogeographical_regions` set to the selected values and current query/language, display the returned hits, and update result-set facet counts from the response metadata

#### Scenario: Disabled biogeographical regions filter not sent
- **WHEN** the Biogeographical regions filter is disabled even if regions were previously selected
- **THEN** the client SHALL NOT include `biogeographical_regions` in the explorer search request body

## ADDED Requirements

### Requirement: Unsupported leftover filters are not available

The explorer filter interface SHALL NOT expose Time, Phase, or Scale filters as part of the facet filter set. Existing saved or in-memory values for `time`, `phases`, or `scales` SHALL be ignored or stripped before they can restrict results.

#### Scenario: Time filter is not shown
- **WHEN** the explorer filter manager renders available and active filters
- **THEN** it SHALL NOT include a Time filter control

#### Scenario: Phase and Scale filters are not shown
- **WHEN** the explorer filter manager renders available and active filters
- **THEN** it SHALL NOT include Phase or Scale filter controls

#### Scenario: Unsupported saved filter keys do not restrict results
- **WHEN** a saved search or in-memory filter payload contains `time`, `phases`, or `scales`
- **THEN** those keys SHALL NOT be sent to the explorer search API and SHALL NOT affect the rendered result set
## ADDED Requirements

### Requirement: Enabling a facet panel does not trigger search

Turning on a facet filter section (Sector, Hazards, Biogeographical regions, or equivalent) via the panel switch SHALL only expose the filter UI. It SHALL NOT by itself call `POST /api/search`, change the displayed result list, or add facet parameters to the next request.

#### Scenario: Enable sector panel with no checkboxes

- **WHEN** the user enables the Sector filter panel and has not selected any sector values
- **THEN** the client SHALL NOT send a new `POST /api/search` request and the displayed hits SHALL remain the same as before enable

#### Scenario: Enable hazards panel with no checkboxes

- **WHEN** the user enables the Hazards filter panel without selecting any climate impact values
- **THEN** the client SHALL NOT send a new `POST /api/search` request

### Requirement: Facet refetch runs on selection changes

The client SHALL call `POST /api/search` when the user selects or deselects facet values inside an enabled panel such that the set of active facet values changes. This includes selecting the first value, changing the selection set, deselecting all values while the panel stays enabled, and disabling a panel that had active selections.

#### Scenario: First sector selection triggers search

- **WHEN** the Sector panel is enabled with no prior sector constraint and the user selects one sector
- **THEN** the client SHALL send `POST /api/search` with `sectors` containing that value (and current text context per search-execution rules)

#### Scenario: Deselect all sectors refetches

- **WHEN** the user deselects every sector while the Sector panel remains enabled
- **THEN** the client SHALL send `POST /api/search` without a `sectors` field (or with no effective sector constraint) and SHALL update displayed hits accordingly

## MODIFIED Requirements

### Requirement: Only active filters are sent in the query and facets

The client SHALL send facet parameters to `POST /api/search` only for filters that have at least one **selected** facet value (or equivalent active constraint). A filter panel that is **enabled** but has zero selected values SHALL NOT cause that category to appear in the request body. When a filter panel is **disabled**, the client SHALL NOT include that filter's values in the request body regardless of any retained UI selection state.

#### Scenario: Enabled panel with no selection not sent

- **WHEN** the Sector filter panel is enabled and no sector checkbox is selected
- **THEN** the next search or load SHALL NOT include a `sectors` parameter

#### Scenario: Disabled filter not sent

- **WHEN** the user had previously enabled the Sector filter and selected "Agriculture", then disables the Sector filter panel (without clearing checkbox state in the UI)
- **THEN** the next search or load SHALL be performed without a `sectors` parameter, and results SHALL not be restricted by sector

#### Scenario: Only categories with selections in request

- **WHEN** the user has Sector filter enabled with one or more selected sectors and Hazards panel enabled with no hazard selected
- **THEN** `POST /api/search` SHALL include `sectors` and SHALL NOT include `climate_impacts`

### Requirement: Applying facet filters triggers search with facet params

When the user changes the set of **selected** facet values in an enabled facet filter (e.g. checks or unchecks sectors and/or climate impacts), the client SHALL perform a new request to `POST /api/search` with the current text context (per explorer search execution rules) and the selected facet values in the corresponding body fields only for categories that have at least one selected value. The client SHALL replace the current result set with the response hits and refetch result-set facet counts with the returned hit IDs. Merely enabling the filter panel without changing selections SHALL NOT trigger this requirement.

#### Scenario: User selects sector

- **WHEN** the user selects "Agriculture" in the enabled Sector filter (including the first selection after enable-only)
- **THEN** the client SHALL send `POST /api/search` with body including `sectors: ["Agriculture"]` and the current text context, display the returned hits, and refetch result-set facet counts with those hit IDs

#### Scenario: User selects multiple facets

- **WHEN** the user selects one or more sectors and one or more climate impacts in enabled panels
- **THEN** the client SHALL send `POST /api/search` with `sectors` and `climate_impacts` arrays containing the selected values, display the returned hits, and refetch result-set facet counts with those hit IDs

#### Scenario: User clears all facet selections in a category

- **WHEN** the user deselects every value in an enabled Sector filter
- **THEN** the client SHALL send `POST /api/search` without an effective `sectors` constraint, display the returned hits, and refetch result-set facet counts with those hit IDs

### Requirement: Filter state and search context preserved

When sending `POST /api/search` with facet params, the client SHALL preserve the current **active** text search context and language, and limit, so that the request reflects the user's full intent. An active text search is a non-empty trimmed query in the store **only when** the search filter panel is enabled (see explorer search execution). The filter UI SHALL reflect applied facet **selections** (not merely enabled empty panels) so the user can add, remove, or change filters and see updated results.

#### Scenario: Active text search preserved with facets

- **WHEN** the user had previously run a text search for "flood" with the search filter enabled and then selects a sector
- **THEN** the next `POST /api/search` request SHALL include both `query: "flood"` and the selected `sectors` (and other facet params if any)

#### Scenario: Inactive text search not sent with facets

- **WHEN** the search filter panel is disabled, the store still contains `flood`, and the user selects a sector
- **THEN** the next `POST /api/search` request SHALL NOT include `query: "flood"` and SHALL apply facet params on an empty-query load (or equivalent)

#### Scenario: Applied selections visible in UI

- **WHEN** facet values have been selected and applied via search
- **THEN** the filter components SHALL show the current selection and SHALL allow the user to clear or change them
