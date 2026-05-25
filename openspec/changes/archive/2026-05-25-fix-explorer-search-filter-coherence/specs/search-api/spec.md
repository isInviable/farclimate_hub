## MODIFIED Requirements

### Requirement: Explorer search path separates aggregate metadata from page fetching

The system SHALL provide an explorer-oriented search API path or RPC integration that supports requesting aggregate metadata separately from page-only article fetching. This path SHALL accept the supported explorer facet filters `sectors`, `climate_impacts`, `adaptation_approaches`, and `biogeographical_regions` when provided by the client. This path SHALL coexist with the existing `/api/search` contract unless and until existing consumers are migrated.

#### Scenario: Aggregate metadata requested
- **WHEN** the explorer sends a search request whose query, filters, language, or ranking parameters differ from the previous active search
- **THEN** the API SHALL support returning the full matching result `total`, full-match facet metadata, and the requested page of full article hits

#### Scenario: Page-only request for same search
- **WHEN** the explorer requests a different page with the same normalized search signature
- **THEN** the API SHALL support returning only that page of full article hits without returning or recomputing aggregate metadata

#### Scenario: Adaptation approaches accepted by explorer search
- **WHEN** the explorer sends `adaptation_approaches` as a non-empty array in the search request
- **THEN** the API SHALL restrict the matching set to documents whose `knowledge.summary.adaptation_approaches` overlaps with the requested values

#### Scenario: Keywords remain API-supported but not explorer-exposed
- **WHEN** the existing search API receives `keywords` from a valid non-explorer consumer
- **THEN** the API MAY continue to apply keyword facet filtering according to the existing search contract
- **AND** the explorer filter UI SHALL NOT expose Keywords as a selectable filter in this change

## ADDED Requirements

### Requirement: Explorer client sends only supported server-backed filter parameters

The explorer client SHALL map active filter UI state to server-backed search parameters using only the supported explorer filter set: `sectors`, `climate_impacts`, `adaptation_approaches`, and `biogeographical_regions`. The explorer client SHALL NOT send unsupported UI leftovers such as `time`, `phases`, or `scales`.

#### Scenario: Adaptation approaches mapped from UI state
- **WHEN** the Adaptation approaches filter is active with one or more selected values
- **THEN** the explorer search request body SHALL include `adaptation_approaches` with those selected values

#### Scenario: Keywords omitted from explorer UI requests
- **WHEN** the explorer user applies filters through the sidebar
- **THEN** the request body SHALL NOT include `keywords` unless a future capability explicitly exposes a Keywords filter

#### Scenario: Unsupported filter keys omitted
- **WHEN** effective explorer filter state contains `time`, `phases`, or `scales`
- **THEN** the request body SHALL omit those keys
