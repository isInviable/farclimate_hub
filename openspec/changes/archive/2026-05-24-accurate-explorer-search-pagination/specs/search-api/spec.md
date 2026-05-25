## ADDED Requirements

### Requirement: Explorer search path separates aggregate metadata from page fetching

The system SHALL provide an explorer-oriented search API path or RPC integration that supports requesting aggregate metadata separately from page-only article fetching. This path SHALL coexist with the existing `/api/search` contract unless and until existing consumers are migrated.

#### Scenario: Aggregate metadata requested

- **WHEN** the explorer sends a search request whose query, filters, language, or ranking parameters differ from the previous active search
- **THEN** the API SHALL support returning the full matching result `total`, full-match facet metadata, and the requested page of full article hits

#### Scenario: Page-only request for same search

- **WHEN** the explorer requests a different page with the same normalized search signature
- **THEN** the API SHALL support returning only that page of full article hits without returning or recomputing aggregate metadata

### Requirement: Explorer search response distinguishes returned count from full total

The explorer search response SHALL distinguish the number of hits returned in the current page from the total number of matching documents in the full result set.

#### Scenario: More matches than page limit

- **WHEN** a search matches 83 documents and the requested page limit is 60
- **THEN** the response SHALL expose `total: 83`
- **AND** the page hit collection SHALL contain no more than 60 full article hits

#### Scenario: Page-only response

- **WHEN** aggregate metadata is not requested for a page-only response
- **THEN** the response SHALL still expose enough pagination information for the client to place the returned hits in the active page cache
