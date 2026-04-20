## ADDED Requirements

### Requirement: Pins created from an article view propagate source document context

When a pin is created from a UI surface rendering a known knowledge document (e.g. `ArticleViewAI` and its child views such as `ArticleSummaryView`), the client SHALL populate both `source_document_uid` (from the parent document) and `source_title_snapshot` (composed from the article title and, when available, the block/section label) on the inserted `human.pins` row. The "source missing" degraded UI SHALL only be shown for pins created outside of a known-document context.

#### Scenario: Pinning a sub-block of an article links to the parent document

- **WHEN** an authenticated user pins any sub-block (e.g. sector, hazards, contact, website, short description) from within `ArticleViewAI` for an article whose `document_uid` is known
- **THEN** the created `human.pins` row SHALL have `source_document_uid` equal to that document's `document_uid` and `source_title_snapshot` SHALL include the article title

#### Scenario: Board shows "Open in explorer" for block pins from articles

- **WHEN** the pinboard page (`/explorer/board`) renders a pin created via the article block flow
- **THEN** the card SHALL show the "Open in explorer" deep link (not the "source missing" warning) and clicking it SHALL navigate to the explorer with that `document` query parameter

#### Scenario: Block pin badge reflects block semantics

- **WHEN** a user pins a `contact` block or a `website` block from an article view
- **THEN** the persisted `body_kind` SHALL be `contact` or `website` respectively, and the board SHALL render the corresponding localized label from `pins.kinds.*`

#### Scenario: Pins without a host article keep degraded state

- **WHEN** a `SelectableBlock` (or other pin entry point) is rendered outside of a view that provides article context and the user pins it
- **THEN** the created pin MAY have `source_document_uid = null` and the board SHALL continue to display the existing "source missing" message for that pin

## MODIFIED Requirements

### Requirement: Logical document reference and missing source
When `source_document_uid` is set, the app SHALL attempt to resolve the current knowledge document (e.g. via existing search or document APIs). If resolution fails, the UI SHALL still show `source_title_snapshot` and pin `body`, SHALL show a clear **source missing** (or equivalent i18n) badge, and SHALL disable or omit deep links to the document; viewing pin body and `user_note` SHALL remain possible. Clients SHALL set `source_document_uid` whenever the pinned content originates from a surface that knows its parent knowledge document (e.g. article views); omitting `source_document_uid` in such cases is a client-side defect, not an acceptable fallback.

#### Scenario: Resolved document offers navigation
- **WHEN** `source_document_uid` resolves to a live document
- **THEN** the user SHALL be able to open the explorer or article view from the pin

#### Scenario: Unresolved document does not break the pin
- **WHEN** `source_document_uid` does not resolve
- **THEN** the pin content and note remain visible and the UI SHALL indicate that the source is unavailable

#### Scenario: Article-hosted pin never omits source_document_uid
- **WHEN** a pin is created from any UI block inside an article view whose document `document_uid` is known
- **THEN** the insert payload to `human.pins` SHALL include that `document_uid` as `source_document_uid`
