## MODIFIED Requirements

### Requirement: Pin UI is available only to authenticated owners

The frontend SHALL load and manage pinboard and pin data only when the user is authenticated and owns the current project. Demo or `anon` users SHALL NOT receive successful direct client reads or writes to `human.pinboards` or `human.pins`. Pin capture affordances (capturable blocks, text selection pin, document pin, mind map pin, chat conversation pin) SHALL remain visible to demo users; attempting to use them SHALL trigger the platform auth-required modal with pin-context copy rather than opening the capture flow or hiding the control. Public shared board URLs with valid share tokens SHALL be the only exception for read-only pin viewing without authentication, and SHALL load pins through a server-mediated public read path rather than direct browser table access.

#### Scenario: Signed-in user with a project can open pins for that project

- **WHEN** an authenticated user has selected a project they own
- **THEN** the app SHALL load that project's pinboard and pins from Supabase using `client.schema('human')` for `pinboards` and `pins`

#### Scenario: Demo user sees pin affordances with sign-in guidance

- **WHEN** the user is not signed in and activates a pin capture control in the explorer
- **THEN** the app SHALL NOT query `human.pinboards` / `human.pins` for a write
- **AND** the app SHALL show the auth-required modal explaining the pinboard purpose
- **AND** the app SHALL NOT open the pin capture dialog

#### Scenario: Demo user cannot access private pinboard route

- **WHEN** the user is not signed in and navigates directly to `/explorer/board`
- **THEN** the app SHALL redirect to login with `returnTo=/explorer/board`
- **AND** the app SHALL NOT render the private pinboard page

#### Scenario: Public shared board loads without authentication

- **WHEN** an unauthenticated viewer opens `/explorer/board/public/:token` with a valid enabled share token
- **THEN** the app SHALL load that shared project's pins through the public board read path and render them in read-only mode

#### Scenario: Non-owner can view public shared board

- **WHEN** an authenticated user who does not own the project opens `/explorer/board/public/:token` with a valid enabled share token
- **THEN** the app SHALL load that shared project's pins through the public board read path and render them in read-only mode

### Requirement: Explorer mind map modal exposes pin capture for authenticated users

The Explorer mind map fullscreen modal SHALL expose a capture action that opens the same optional-note pin capture flow used elsewhere. The action SHALL be visible to demo users; activating it while unauthenticated SHALL trigger the auth-required modal with pin-context copy instead of opening the capture flow. Canceling the auth modal or capture flow SHALL NOT insert a pin.

#### Scenario: Authenticated user opens capture from mind map

- **WHEN** an authenticated user activates the mind map pin control
- **THEN** the application SHALL open the pin capture flow prefilled with the mind-map structured payload

#### Scenario: Demo user sees mind map pin control with auth gate

- **WHEN** the user is not signed in and activates the mind map pin control
- **THEN** the application SHALL show the auth-required modal
- **AND** the application SHALL NOT open the pin capture dialog
- **AND** the application SHALL NOT insert `human.pins` rows

### Requirement: Document preview and full article expose Pin document

The **document preview** layout and the **full article** layout each SHALL expose an explicit control (e.g. "Pin document" or equivalent localized label) that creates a pin with the same persisted shape as search-hit whole-document pinning (`body_kind` `document`, required fields above). The control SHALL be visible to demo users; activating it while unauthenticated SHALL trigger the auth-required modal with pin-context copy.

#### Scenario: Preview and article both create document pins

- **WHEN** an authenticated user uses Pin document from document preview and separately from full article for the same logical document
- **THEN** each action SHALL insert a `human.pins` row with `body_kind` `document` and the correct `source_document_uid` for that document (multiple rows allowed; no deduplication required)

#### Scenario: Demo user sees Pin document control

- **WHEN** the user is not signed in and clicks Pin document in the article side panel or full article layout
- **THEN** the application SHALL show the auth-required modal
- **AND** the application SHALL NOT open the pin capture dialog

## ADDED Requirements

### Requirement: Private pinboard route requires authentication

The private pinboard page at `/explorer/board` SHALL be accessible only to authenticated users. Unauthenticated access SHALL redirect to login. The public shared board route `/explorer/board/public/:token` SHALL remain accessible without authentication per existing public board requirements.

#### Scenario: Authenticated user opens private pinboard

- **WHEN** an authenticated user navigates to `/explorer/board`
- **THEN** the app SHALL render the private pinboard for the current project

#### Scenario: Demo user blocked from private pinboard URL

- **WHEN** a user without a valid session opens `/explorer/board`
- **THEN** the app SHALL redirect to `/login?returnTo=/explorer/board`

#### Scenario: Public board URL unaffected

- **WHEN** any viewer opens `/explorer/board/public/:token` with a valid enabled share token
- **THEN** the app SHALL NOT require authentication for that route
