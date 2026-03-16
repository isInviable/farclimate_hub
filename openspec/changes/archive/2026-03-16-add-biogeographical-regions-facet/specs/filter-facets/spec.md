## MODIFIED Requirements

### Requirement: Filter facets available with global and result-set counts
The system SHALL provide a way to obtain filter facets (unique values and counts) for the array fields `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords`, and `biogeographical_regions` from `knowledge.summary`. The response SHALL include **global** counts (over the entire table) and, when a set of document IDs is supplied, **counts restricted to that set** (result set), so the UI can show both absolute counts and the percentage of available data in each category that the current results represent.

#### Scenario: Global facets only (no document set)
- **WHEN** the facets function is called with no document IDs (or null/empty)
- **THEN** the response SHALL contain a global facet set with, for each of the five categories (sectors, climate_impacts, adaptation_approaches, keywords, biogeographical_regions), a list of `{ value, count }` entries ordered by count descending

#### Scenario: Global and result-set facets in one call
- **WHEN** the facets function is called with a non-empty array of document IDs (e.g. the current search hit IDs)
- **THEN** the response SHALL contain both global counts and result-set counts for each category, so the client can compute percentage (e.g. 67 of 342 → 19.6%) without a second request

#### Scenario: Stable response shape
- **WHEN** the client receives the facets response
- **THEN** each category (sectors, climate_impacts, adaptation_approaches, keywords, biogeographical_regions) SHALL be a list of objects with at least `value` (string) and `count` (number), ordered by count descending
