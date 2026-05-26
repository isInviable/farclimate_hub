## MODIFIED Requirements

### Requirement: Pin UI is available only to authenticated owners
The frontend SHALL expose pinboard and pin management only when the user is authenticated and owns the current project. Demo or `anon` users SHALL NOT receive successful direct client reads or writes to `human.pinboards` or `human.pins`. Public shared board URLs with valid share tokens SHALL be the only exception for read-only pin viewing, and SHALL load pins through a server-mediated public read path rather than direct browser table access.

#### Scenario: Signed-in user with a project can open pins for that project
- **WHEN** an authenticated user has selected a project they own
- **THEN** the app SHALL load that project’s pinboard and pins from Supabase using `client.schema('human')` for `pinboards` and `pins`

#### Scenario: Demo user sees no database-backed private pins
- **WHEN** the user is not signed in and is not viewing a public shared board URL
- **THEN** the app SHALL NOT query `human.pinboards` / `human.pins` and SHALL show sign-in guidance or hide private pin features

#### Scenario: Public shared board loads without authentication
- **WHEN** an unauthenticated viewer opens `/explorer/board/public/:token` with a valid enabled share token
- **THEN** the app SHALL load that shared project's pins through the public board read path and render them in read-only mode

#### Scenario: Non-owner can view public shared board
- **WHEN** an authenticated user who does not own the project opens `/explorer/board/public/:token` with a valid enabled share token
- **THEN** the app SHALL load that shared project's pins through the public board read path and render them in read-only mode

## ADDED Requirements

### Requirement: Public shared board renders project pins
The public shared board SHALL render the same `human.pins` rows as the owner's private board for the project resolved from the public share token, ordered by `sort_order` ascending with the same deterministic tie-breaker used by the private board. The public board SHALL return enough project metadata to display a project title without depending on the authenticated projects store.

#### Scenario: Public board shows ordered pins
- **WHEN** any viewer opens `/explorer/board/public/:token` for an enabled share whose project has pins
- **THEN** the board SHALL show those pins in the same order as the private board

#### Scenario: Public board header shows project name
- **WHEN** any viewer opens `/explorer/board/public/:token` for an enabled share
- **THEN** the public board header SHALL display the project's name from the public board payload

#### Scenario: Public board handles zero pins
- **WHEN** any viewer opens `/explorer/board/public/:token` for an enabled share whose project board has no pins
- **THEN** the board SHALL show the public empty state rather than an authentication prompt

### Requirement: Public shared board is read-only
The public shared board SHALL NOT expose pin creation, editing, deletion, reordering, selection-driven actions, artifact generation, or saved-search management. Shared view-only features derived from the loaded pin list, such as grid, map, and article drawer behavior, SHALL remain available when their existing data requirements are met.

#### Scenario: Public board hides edit affordances
- **WHEN** any viewer opens `/explorer/board/public/:token`
- **THEN** pin edit, delete, create, reorder, and selection controls SHALL be absent or disabled

#### Scenario: Public board excludes saved searches
- **WHEN** any viewer opens `/explorer/board/public/:token`
- **THEN** saved searches SHALL NOT be fetched or displayed as part of the public board

#### Scenario: Public board keeps shared pin-list views
- **WHEN** any viewer opens `/explorer/board/public/:token` and the loaded pins satisfy an existing read-only view's data requirements
- **THEN** that view, such as the pin grid, map, or article drawer, SHALL work without requiring authentication

### Requirement: Share board action creates token URL
The share board action SHALL create or reuse an enabled server-side share token for the current owner project and copy a public URL containing that token. The copied URL SHALL NOT contain the project UUID as the public route identifier.

#### Scenario: Owner copies share token URL
- **WHEN** an authenticated project owner clicks the Share board action
- **THEN** the app SHALL request a share token for the current project and copy `/explorer/board/public/:token`

#### Scenario: Repeated share uses existing enabled token
- **WHEN** an authenticated project owner clicks the Share board action multiple times for the same project and an enabled share token already exists
- **THEN** the app SHALL reuse the existing enabled token rather than creating multiple active links

#### Scenario: Public URL hides project id
- **WHEN** the app copies a public board URL
- **THEN** the route parameter SHALL be the share token, not the project UUID
