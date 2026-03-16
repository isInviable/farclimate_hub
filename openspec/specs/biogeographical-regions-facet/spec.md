# Biogeographical regions facet (new capability)

Backend and data contract for faceting and filtering by EU biogeographical regions derived from `summary.geographic_characterisation.biogeographical_regions` (JSONB). No new column: derivation is done in SQL. Documents where the value could not be extracted (null or missing) are exposed as **"no-identificados"**.

---

## ADDED Requirements

### Requirement: Biogeographical regions derived from JSONB; null/empty as "no-identificados"

The system SHALL derive biogeographical regions for faceting and filtering from the existing `geographic_characterisation` JSONB on `knowledge.summary` (key `biogeographical_regions`). No new column SHALL be added. When the JSONB value is a string (e.g. "Atlantic" or "Alpine, Pannonian"), the system SHALL normalize it to a list by splitting on comma and trimming; when it is a JSON array, the system SHALL use its text elements. When the value is null or the key is missing (information could not be extracted from source), the document SHALL be counted and filterable under the single facet value **"no-identificados"**.

#### Scenario: String source normalized to list
- **WHEN** the document has `geographic_characterisation.biogeographical_regions` equal to the string `"Alpine, Pannonian"`
- **THEN** the document SHALL contribute to facet counts for "Alpine" and "Pannonian" and SHALL match when the user filters by either region

#### Scenario: Single region string
- **WHEN** the document has `geographic_characterisation.biogeographical_regions` equal to the string `"Atlantic"`
- **THEN** the document SHALL contribute to the "Atlantic" facet count and SHALL match when the user filters by "Atlantic"

#### Scenario: Null or missing → "no-identificados"
- **WHEN** the document has `geographic_characterisation.biogeographical_regions` equal to null or the key is missing
- **THEN** the document SHALL be counted under the facet value "no-identificados" and SHALL be included when the user filters by "no-identificados"

### Requirement: Biogeographical regions included in filter facets and summary facet arrays

The filter facets function (e.g. `get_filter_facets`) SHALL return a fifth category `biogeographical_regions` with the same shape as the existing categories: a list of `{ value, count }` for global and, when document IDs are supplied, for_result_set. The list SHALL include an entry for "no-identificados" when at least one document has null/empty region data. The summary facet arrays function (e.g. `get_summary_facet_arrays`) SHALL return a field `biogeographical_regions` (array of text) per document: either the normalized list of region names or a single-element array `["no-identificados"]` when null/empty, so that the search API can apply facet filters (AND across categories, OR within regions).

#### Scenario: Facets response includes biogeographical_regions and no-identificados
- **WHEN** the client calls the facets RPC (or POST /api/facets) with or without doc_ids
- **THEN** the response SHALL include `global.biogeographical_regions` and `for_result_set.biogeographical_regions` as lists of `{ value, count }` ordered by count descending, including "no-identificados" when applicable

#### Scenario: Summary facet arrays include biogeographical_regions for filter application
- **WHEN** the search API calls the summary facet arrays RPC with a set of document IDs
- **THEN** each row SHALL include a `biogeographical_regions` field (TEXT[] or equivalent): normalized region names or `["no-identificados"]` for null/empty, so that filter-by-region and filter-by-no-identificados can be applied

### Requirement: Search API accepts and applies biogeographical_regions filter

The search API (e.g. POST /api/search) SHALL accept an optional body field `biogeographical_regions` as an array of strings. When present and non-empty, the API SHALL restrict results to documents that have at least one of the given values in their summary facet array (including "no-identificados" when that value is selected), in the same way as for sectors and climate_impacts (AND with other facet categories, OR within the list of regions).

#### Scenario: Search with biogeographical_regions filter
- **WHEN** the client sends POST /api/search with body `{ query: "...", biogeographical_regions: ["Atlantic", "Mediterranean"] }`
- **THEN** the returned hits SHALL only include documents whose derived `biogeographical_regions` array contains "Atlantic" or "Mediterranean"

#### Scenario: Search filtered by no-identificados
- **WHEN** the client sends POST /api/search with body including `biogeographical_regions: ["no-identificados"]`
- **THEN** the returned hits SHALL only include documents where region data could not be extracted (null or missing)

#### Scenario: Search without biogeographical_regions
- **WHEN** the client sends POST /api/search without the `biogeographical_regions` field or with an empty array
- **THEN** results SHALL NOT be restricted by region
