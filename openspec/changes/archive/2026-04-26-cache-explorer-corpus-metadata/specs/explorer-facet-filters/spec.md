## MODIFIED Requirements

### Requirement: Facets fetched after search or load all
The explorer SHALL fetch corpus metadata independently from search result loading and SHALL fetch result-set facet counts after each successful search or empty-query load. On explorer initialization, the client SHALL request `GET /api/explorer/corpus-metadata` for corpus totals. When search/load returns hits, the client SHALL call `POST /api/facets` with the returned hit IDs so the filter UI can show current result-set counts in relation to corpus totals.

#### Scenario: Corpus metadata requested on explorer load
- **WHEN** the explorer initializes
- **THEN** the client SHALL request `GET /api/explorer/corpus-metadata` and store the returned `globalFacets` for the filter UI

#### Scenario: Search refetches result-set facets
- **WHEN** the user performs a hybrid or keyword search and the endpoint returns a `hits` array
- **THEN** the client SHALL update displayed results and call `POST /api/facets` with `doc_ids` equal to the returned hit IDs

#### Scenario: Empty-query load does not require all corpus document IDs
- **WHEN** the explorer requests initial empty-query results
- **THEN** the client SHALL request only a bounded result set and SHALL use those returned hit IDs for result-set facet counts

#### Scenario: No results keeps corpus facets available with empty overlays
- **WHEN** a search returns zero hits
- **THEN** the filter UI SHALL continue to show global corpus facet options and SHALL show zero or empty current counts for the result set

### Requirement: Filter components use real facet data
The Sector, Hazards (climate impacts), and any Adaptation approaches or Keywords filter components SHALL be driven by real facet data. Options and corpus totals SHALL come from global facet data. Current counts SHALL come from `for_result_set` facet data fetched with the current returned hit IDs. The mapping SHALL be: Sector → `sectors`, Hazards → `climate_impacts`, Adaptation approaches → `adaptation_approaches`, Keywords → `keywords`.

#### Scenario: Sector filter shows metadata-driven options
- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.sectors`
- **THEN** the Sector filter component SHALL display sector options and corpus total counts from that data

#### Scenario: Hazards filter shows metadata-driven options
- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.climate_impacts`
- **THEN** the Hazards (climate impacts) filter component SHALL display options and corpus total counts from that data

#### Scenario: Current over total count per facet option
- **WHEN** the filter component renders a facet option
- **THEN** it SHALL show a current-result-set count in relation to the corpus-wide count for that value, for example `6 / 14`

#### Scenario: Overlay counts update after result set changes
- **WHEN** the user applies a new search or facet filter and the displayed result set changes
- **THEN** the current count and foreground bar SHALL update from `for_result_set` counts while the total count and background bar SHALL remain corpus-wide

### Requirement: Applying facet filters triggers search with facet params
When the user applies one or more **active** facet filters (e.g. selects one or more sectors and/or climate impacts and the corresponding filter is enabled), the client SHALL perform a new request to `POST /api/search` with the same `query` and `lang` as the current context, plus the selected facet values in the corresponding body fields (`sectors`, `climate_impacts`, `adaptation_approaches`, `keywords`) only for those filters that are active. The client SHALL replace the current result set with the response hits and refetch result-set facet counts with the returned hit IDs.

#### Scenario: User selects sector and applies
- **WHEN** the user selects "Agriculture" in the Sector filter and applies (or confirms) the filter
- **THEN** the client SHALL send `POST /api/search` with body including `sectors: ["Agriculture"]` (and current query/lang), display the returned hits, and refetch result-set facet counts with those hit IDs

#### Scenario: User selects multiple facets and applies
- **WHEN** the user selects one or more sectors and one or more climate impacts and applies
- **THEN** the client SHALL send `POST /api/search` with `sectors` and `climate_impacts` arrays containing the selected values, display the returned hits, and refetch result-set facet counts with those hit IDs

#### Scenario: User clears facet filters
- **WHEN** the user clears one or all facet filters
- **THEN** the client SHALL send `POST /api/search` without the cleared categories (or with empty arrays), display the returned hits, and refetch result-set facet counts with those hit IDs

### Requirement: Biogeographical regions filter uses real facet data
A Biogeographical regions filter SHALL be available in the explorer. Options and corpus totals SHALL come from `globalFacets.biogeographical_regions`; current counts SHALL come from `for_result_set.biogeographical_regions`. The filter SHALL behave like the Sector and Hazards filters: same component pattern, only active filters sent in the query, and applying the filter SHALL trigger a search with the selected regions in the request body.

#### Scenario: Biogeographical regions filter shows metadata-driven options
- **WHEN** corpus metadata has been fetched and the response includes `globalFacets.biogeographical_regions`
- **THEN** the Biogeographical regions filter component SHALL display options and corpus totals from that data, with current counts from the latest result-set facets when available

#### Scenario: Biogeographical regions filter uses same apply behaviour as other facets
- **WHEN** the user selects one or more biogeographical regions and applies the filter
- **THEN** the client SHALL send `POST /api/search` with body including `biogeographical_regions` set to the selected values (and current query/lang), display the returned hits, and refetch result-set facet counts with those hit IDs

#### Scenario: Disabled biogeographical regions filter not sent
- **WHEN** the Biogeographical regions filter is disabled (even if regions were previously selected)
- **THEN** the client SHALL NOT include `biogeographical_regions` in the `POST /api/search` request body
