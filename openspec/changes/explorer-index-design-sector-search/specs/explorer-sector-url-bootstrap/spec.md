## ADDED Requirements

### Requirement: Sector query matches typed search text

When the main explorer route loads with a non-empty `sector` query parameter whose value is not the reserved “view all” token, the application SHALL set the hybrid search free-text store to **exactly** the URL-provided string (trimmed; using router-decoded values), run the same hybrid search as manual submission, and SHALL NOT substitute synonyms or canonical labels. The outcome SHALL be indistinguishable from the user typing that same string into the explorer search box and searching.

#### Scenario: Arbitrary sector string

- **WHEN** the user opens `/explorer/explorer?sector=forest%20management`
- **THEN** `searchStore.searchQuery` SHALL equal `forest management` and hybrid search SHALL execute with that text

#### Scenario: Simple slug matches typing

- **WHEN** the user opens `/explorer/explorer?sector=agriculture`
- **THEN** behavior SHALL match typing `agriculture` in the search box (same stored query string and same search invocation path)

#### Scenario: View all sectors

- **WHEN** the user opens `/explorer/explorer?sector=all` and does not provide an overriding explicit search parameter
- **THEN** the application SHALL load the full corpus (equivalent to empty free-text search) without applying text from `sector`

### Requirement: Search input reflects URL on load

The explorer sidebar search input SHALL be bound to the same free-text source as hybrid search (`searchStore.searchQuery`). When the URL initializes or updates that value from `sector`, `query`, or `type`, the visible search field SHALL display that value without requiring an extra user action.

#### Scenario: Input shows seeded query

- **WHEN** the page loads with `sector=agriculture`
- **THEN** the search input SHALL show `agriculture` before the user focuses or edits the field

### Requirement: Explicit search query parameters take precedence

If `query` or `type` query parameters contain a non-empty search string, that string SHALL initialize the free-text search instead of any value derived from `sector`. If both explicit parameters are present, precedence SHALL be documented in code comments and SHALL favor `query` then `type` (or the inverse if legacy demands — implementation MUST pick one order and apply consistently).

#### Scenario: Explicit parameter wins over sector

- **WHEN** the URL includes both `sector=agriculture` and `query=drought`
- **THEN** the stored query text and hybrid search SHALL use `drought`

### Requirement: Client-side navigation updates search

Changing `sector`, `query`, or `type` via in-app navigation (without full page reload) SHALL re-run the same initialization logic so results and the search input stay in sync with the URL.

#### Scenario: Navigate from landing

- **WHEN** the user moves from the explorer index to `/explorer/explorer` with a new `sector` value using client-side routing
- **THEN** the explorer SHALL update stored query text, refresh results, and update the search input accordingly

### Requirement: Filter sidebar facets unchanged by default

Initializing search from `sector` SHALL NOT automatically mutate explorer facet checkbox state unless a future change explicitly specifies facet synchronization.

#### Scenario: Sector bootstrap only affects free text

- **WHEN** sector-based bootstrap runs
- **THEN** explorer facet selections SHALL remain whatever the user or defaults provide independent of the `sector` string unless the user changes filters manually
