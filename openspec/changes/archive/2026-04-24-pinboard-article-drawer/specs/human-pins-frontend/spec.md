## ADDED Requirements

### Requirement: Pinboard provides an in-page article side panel

The pinboard (`PinBoardView` or successor, as used on both `/explorer/board` and `/explorer/board/public/[id]`) SHALL provide an in-page side-panel article reader powered by the existing `ArticleSidePanel` component. Opening the panel SHALL NOT navigate away from the pinboard; closing the panel SHALL leave the pinboard state unchanged (same view, same selected kind, same map/grid choice).

#### Scenario: Opening preserves pinboard state

- **WHEN** the user opens the article drawer on the pinboard with any view selected (grid or map)
- **THEN** the drawer SHALL appear as a side slideover without replacing the pinboard’s main area, and the pinboard view/section selection SHALL be preserved while the drawer is open

#### Scenario: Drawer is available on the public shared board

- **WHEN** an unauthenticated viewer opens the article drawer on a public shared pinboard
- **THEN** the drawer SHALL render the article in read-only mode without requiring authentication

### Requirement: Drawer opens from map markers

When a user activates the **Open article** button in the Map view’s marker popup (introduced by `pinboard-global-map`), the application SHALL open the article drawer for that marker’s `source_document_uid` and SHALL provide the marker’s grouped pins as the panel’s pins context.

#### Scenario: Open article from map popup

- **WHEN** a user clicks the **Open article** button in a map marker popup
- **THEN** the drawer SHALL open with the corresponding article loaded and SHALL show the user’s pins for that article alongside the article content

### Requirement: Drawer opens from pin card clicks

Clicking the body of a `PinBoardCard` on the grid SHALL open the article drawer for that pin’s `source_document_uid` and SHALL pass all sibling pins (pins sharing the same `source_document_uid`) as the panel’s pins context. Clicks on the card’s overflow menu button and on the selection toggle SHALL NOT open the drawer. When `source_document_uid` is missing, the card body click SHALL be inert and the drawer SHALL NOT open.

#### Scenario: Card click opens the drawer

- **WHEN** the user clicks the body of a pin card whose `source_document_uid` is set
- **THEN** the drawer SHALL open with that article and the pins list SHALL include every pin in the board sharing that `source_document_uid`

#### Scenario: Card click does not open during overflow menu interaction

- **WHEN** the user clicks the overflow menu trigger or the selection toggle on a card
- **THEN** the drawer SHALL NOT open

#### Scenario: Degraded pins do not open the drawer

- **WHEN** the user clicks the body of a card whose pin has no `source_document_uid`
- **THEN** the drawer SHALL NOT open and the card’s existing "source missing" UI SHALL remain as the only indication of state

### Requirement: Drawer accepts a document or a document_uid

The article side panel SHALL accept either a preloaded `ArticleDetail` or a `document_uid`. When given a `document_uid`, the panel SHALL resolve the article through the existing `document-by-uid` server route and SHALL render a loading state until the response is available. On resolution failure, the panel SHALL render a friendly, i18n-backed error message in its body without closing the drawer. Callers MAY supply a `titleFallback` string (for example a pin’s `source_title_snapshot`) to display in the header while the article loads.

#### Scenario: Drawer opens with a preloaded document

- **WHEN** a caller supplies a fully-loaded `ArticleDetail`
- **THEN** the drawer SHALL render the article immediately without triggering a fetch

#### Scenario: Drawer opens with a uid and resolves the document

- **WHEN** a caller supplies only a `document_uid`
- **THEN** the drawer SHALL render a loading state, fetch the article via the existing server route, and display the article once available

#### Scenario: Resolution failure shows an error

- **WHEN** the server route fails or returns no document for the supplied uid
- **THEN** the drawer SHALL display a localized error message in the panel body and SHALL remain open until the user closes it

### Requirement: Drawer renders an optional pins-in-article section

When the caller passes a non-empty list of `HumanPinRow` belonging to the opened article, the side panel SHALL render a dedicated section inside its body showing those pins with their localized kind labels and, when non-empty, their `user_note`. When the caller passes no pins (for example the explorer usage), the panel SHALL NOT render the section.

#### Scenario: Pins section appears when pins are provided

- **WHEN** the drawer opens with a non-empty pins list
- **THEN** the body SHALL include a clearly labeled section listing those pins

#### Scenario: Pins section is absent when pins are not provided

- **WHEN** the drawer opens without a pins list (existing explorer usage)
- **THEN** the body SHALL NOT render any pins section and behavior SHALL match the current explorer experience
