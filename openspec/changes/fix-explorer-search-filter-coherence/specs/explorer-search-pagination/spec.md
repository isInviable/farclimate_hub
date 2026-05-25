## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Visible result count matches server-returned page

The explorer SHALL derive visible list, grid, map, bubble, and side-panel navigation inputs from the server-returned page hits for the current search signature. Client-side display helpers MAY annotate or decorate results, but SHALL NOT remove hits from the page based on facet, phase, scale, or time logic.

#### Scenario: Server returns a full page
- **WHEN** the explorer search response contains 30 page hits
- **THEN** result view components SHALL receive those 30 hits for rendering
- **AND** no client-side facet filter pass SHALL reduce the visible set

#### Scenario: Facet counts and visible rows remain aligned
- **WHEN** a facet filter is applied and the server returns page hits, `total`, and facet metadata
- **THEN** visible rows SHALL be drawn from the same server result set used to compute `total` and facet metadata
