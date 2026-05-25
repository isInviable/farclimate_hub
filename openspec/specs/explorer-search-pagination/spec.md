## Purpose

Server-backed explorer search with accurate full-match totals and facet counts, paginated article hydration, client page caching for the active search signature, and accumulated loaded hits for chat-with-results.

## Requirements

### Requirement: Explorer search returns page hits and optional full-match metadata

The system SHALL provide an explorer-specific search path that accepts search text, language, active supported facet filters, pagination parameters, and a flag indicating whether aggregate metadata is required. The response SHALL include full article hits only for the requested page. When aggregate metadata is requested, the response SHALL also include the total number of matching documents and facet counts computed over the full matching document set. The explorer client SHALL render the returned page hits directly and SHALL NOT apply an additional client-side filter pass that restricts which returned hits are visible.

#### Scenario: Query or filters changed

- **WHEN** the explorer sends a request for a new search signature with `includeFacets` enabled
- **THEN** the system SHALL compute the full matching document set using the active query, language, and supported facet filters
- **AND** the system SHALL return `total`, full-match facet counts, and full article hits for the requested page only
- **AND** the client SHALL render the returned page hits without applying additional client-only restrictions

#### Scenario: Page-only request

- **WHEN** the explorer requests another page for the same search signature with `includeFacets` disabled
- **THEN** the system SHALL return full article hits for that page
- **AND** the system SHALL NOT recompute or return full-match facet counts
- **AND** the client SHALL render the returned page hits without applying additional client-only restrictions

#### Scenario: Empty query with filters

- **WHEN** the explorer sends an empty query with one or more active supported facet filters
- **THEN** the system SHALL compute matching documents from the filtered corpus without generating a query embedding
- **AND** the system SHALL return accurate `total` and facet metadata when requested

### Requirement: Explorer search preserves facet filter semantics

The explorer search path SHALL combine selected values within the same supported facet category as OR and combine separate active supported facet categories as AND. Omitted, empty, inactive, or unsupported filter arrays SHALL NOT restrict results.

#### Scenario: OR within sector

- **WHEN** the explorer search request includes `sectors: ["Disaster Risk Reduction", "Buildings"]`
- **THEN** the matching set SHALL include documents that contain either selected sector or both selected sectors

#### Scenario: AND across categories

- **WHEN** the explorer search request includes both `sectors` and `climate_impacts`
- **THEN** the matching set SHALL include only documents that match at least one selected sector and at least one selected climate impact

#### Scenario: Adaptation approaches participate as a supported facet category

- **WHEN** the explorer search request includes `adaptation_approaches`
- **THEN** the matching set SHALL include only documents that match at least one selected adaptation approach, combined with other active facet categories using AND semantics

#### Scenario: Unsupported filters do not restrict server results

- **WHEN** stale client state contains unsupported filter keys such as `time`, `phases`, or `scales`
- **THEN** the explorer search request SHALL not include those keys and the server matching set SHALL not be restricted by them

### Requirement: Visible result count matches server-returned page

The explorer SHALL derive visible list, grid, map, bubble, and side-panel navigation inputs from the server-returned page hits for the current search signature. Client-side display helpers MAY annotate or decorate results, but SHALL NOT remove hits from the page based on facet, phase, scale, or time logic.

#### Scenario: Server returns a full page

- **WHEN** the explorer search response contains 30 page hits
- **THEN** result view components SHALL receive those 30 hits for rendering
- **AND** no client-side facet filter pass SHALL reduce the visible set

#### Scenario: Facet counts and visible rows remain aligned

- **WHEN** a facet filter is applied and the server returns page hits, `total`, and facet metadata
- **THEN** visible rows SHALL be drawn from the same server result set used to compute `total` and facet metadata

### Requirement: Facet counts are computed from lightweight matching rows

The system SHALL compute full-match facet counts from the matched document IDs and `knowledge.summary` facet data. The system SHALL hydrate full article payloads only after selecting page IDs.

#### Scenario: Facets do not require full article hydration

- **WHEN** the system computes facet metadata for a search signature
- **THEN** it SHALL count facet values using lightweight document IDs and summary/facet fields
- **AND** it SHALL NOT require full article rows, image payloads, recipe payloads, or fulltext payloads for every matching document

#### Scenario: Page hydration only

- **WHEN** the system has selected the page IDs for the requested offset and limit
- **THEN** it SHALL hydrate full article data only for those page IDs

### Requirement: Client caches loaded pages for the active search

The explorer client SHALL cache loaded result pages for the current normalized search signature. Loading a new page for the same signature SHALL add or merge that page into the cache without removing previously loaded pages. Changing the search signature SHALL clear the cached pages and aggregate metadata.

#### Scenario: Page navigation retains earlier hits

- **WHEN** the user loads page 1 and then loads page 2 for the same search signature
- **THEN** the client SHALL keep the hits from page 1 and page 2 available in the active search cache

#### Scenario: Search change clears cached pages

- **WHEN** the user changes the query, language, filter values, search mode, or other parameter that affects matching or ranking
- **THEN** the client SHALL treat the request as a new search signature
- **AND** the client SHALL clear loaded pages from the previous signature

### Requirement: Chat with results uses accumulated loaded hits

The explorer chat-with-results feature SHALL build its available result context from the accumulated loaded hits for the active search signature, not only from the most recently loaded page.

#### Scenario: Chat includes results from multiple loaded pages

- **WHEN** the user has loaded page 1 and page 2 for the same search signature and opens chat with results
- **THEN** the chat source set SHALL be able to include documents loaded from both pages

#### Scenario: Chat excludes previous search pages

- **WHEN** the user changes the search signature after loading multiple pages
- **THEN** chat with results SHALL NOT include cached hits from the previous search signature
