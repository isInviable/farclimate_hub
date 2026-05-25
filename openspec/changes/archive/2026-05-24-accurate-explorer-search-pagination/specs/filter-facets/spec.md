## ADDED Requirements

### Requirement: Explorer result-set facets represent the full matching set

When facet counts are shown for explorer search results, the `for_result_set` counts SHALL represent the full matching document set for the active query, language, and filters, not only the current returned page or limited hit slice.

#### Scenario: Matching set exceeds page size

- **WHEN** the active search matches more documents than the current page limit
- **THEN** facet indicators SHALL use counts computed from all matching documents
- **AND** they SHALL NOT use counts computed only from the currently visible page

#### Scenario: Selected sector with another selected sector

- **WHEN** the user selects multiple sectors in the same category
- **THEN** each sector's result-set count SHALL be counted over the documents matching the full OR-within-sector search set

### Requirement: Facet metadata is reused during page-only navigation

The explorer SHALL reuse existing facet metadata while navigating pages for the same search signature. Facet metadata SHALL be recomputed only when a parameter that changes the matching set changes.

#### Scenario: User loads page two

- **WHEN** the user loads another page without changing query, language, filters, or ranking-affecting parameters
- **THEN** facet indicators SHALL remain based on the previously computed full-match metadata
- **AND** the system SHALL NOT require another full facet-count computation for that page navigation

#### Scenario: User changes filters

- **WHEN** the user changes an active facet selection
- **THEN** the explorer SHALL request fresh facet metadata for the new matching set
