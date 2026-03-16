## ADDED Requirements

### Requirement: Biogeographical regions filter uses real facet data

A Biogeographical regions filter SHALL be available in the explorer, driven by the facets API. Options and counts SHALL come from `global.biogeographical_regions` and `for_result_set.biogeographical_regions` returned by `POST /api/facets`. The filter SHALL behave like the Sector and Hazards filters: same component pattern (e.g. BarChartFilter with dual stacked bars), only active filters sent in the query, and applying the filter SHALL trigger a search with the selected regions in the request body.

#### Scenario: Biogeographical regions filter shows API-driven options
- **WHEN** facets have been fetched and the response includes `global.biogeographical_regions` and `for_result_set.biogeographical_regions`
- **THEN** the Biogeographical regions filter component SHALL display options and counts from that data (value and count per row, with for_result_set count or percentage when available)

#### Scenario: Biogeographical regions filter uses same apply behaviour as other facets
- **WHEN** the user selects one or more biogeographical regions and applies the filter
- **THEN** the client SHALL send `POST /api/search` with body including `biogeographical_regions` set to the selected values (and current query/lang), and SHALL update results and refetch facets with the new hit IDs

#### Scenario: Disabled biogeographical regions filter not sent
- **WHEN** the Biogeographical regions filter is disabled (even if regions were previously selected)
- **THEN** the client SHALL NOT include `biogeographical_regions` in the `POST /api/search` request body
