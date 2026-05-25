## ADDED Requirements

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

### Requirement: Facets exposed via public RPC
The facets function SHALL be callable via a public RPC (e.g. `public.get_filter_facets`) so that the web app or server can invoke it through the same Supabase/PostgREST interface used for `get_all_documents` and `hybrid_search`.

#### Scenario: RPC callable with optional doc_ids
- **WHEN** the client calls the public facets RPC with an optional parameter (e.g. `doc_ids` array or null)
- **THEN** the RPC SHALL return a single JSON/JSONB value with the structure defined (global and, if doc_ids provided, for_result_set)

#### Scenario: Empty database
- **WHEN** the facets RPC is called on a database that has no rows in `knowledge.summary`
- **THEN** the response SHALL return empty lists for each category in global (and for_result_set if applicable), not an error

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
