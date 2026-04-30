# human-pins-frontend (change delta)

## ADDED Requirements

### Requirement: Full-paper pins use dedicated body_kind document

The application SHALL persist pins that represent the **entire** catalog knowledge document with `body_kind` exactly `document`. Pins that represent excerpts, sections, selections, mind maps, AI blocks, recipe fragments, images, contacts, websites, chats, saved searches, or any other non-whole-document content SHALL NOT use `body_kind` `document`; they SHALL continue to use their existing kinds (including but not limited to `text_segment`, `selected_text`, `section`, `recipe_section`, `markmap`, `ai_summary`, `grid_compare_summary`, `chat_response`, `image`, `contact`, `website`, `saved_search`).

#### Scenario: Document pin is not a text_segment

- **WHEN** a user creates a pin intended to represent the whole document from an allowed write path in this change
- **THEN** the inserted `human.pins` row SHALL have `body_kind` `document` and SHALL NOT have `body_kind` `text_segment` solely for that intent

#### Scenario: Fragment pin remains a fragment kind

- **WHEN** a user pins a paragraph, selection, markmap, or other in-document block
- **THEN** the inserted row SHALL have a fragment-appropriate `body_kind` and SHALL NOT use `document`

### Requirement: Document pins require source_document_uid and user_note

For `body_kind` `document`, the client SHALL set `source_document_uid` to the catalog document’s stable identifier. The client SHALL set `user_note` according to the same product rules as other pins that require a note on save (including empty string only if the product explicitly allows omitting validation for this kind). The `body` envelope SHALL remain `v: 1` with a `data` object; `data` MAY be empty or minimal if insert validation permits.

#### Scenario: Search-created document pin carries document uid

- **WHEN** a user pins a document from a search hit that includes `document_uid`
- **THEN** the new pin SHALL have `body_kind` `document` and `source_document_uid` equal to that uid

### Requirement: Search hit pinning uses pinCapture with document kind

Pin creation from the **search results** pin affordance SHALL use the explicit capture API (`pinCapture` / `buildPinCapturePayload` or successor) with `bodyKind` `document` and structured fields. That flow SHALL NOT rely on the legacy `pinContent` DOM capture path for the purpose of persisting the pin body kind.

#### Scenario: Search row pin does not use pinContent for body_kind

- **WHEN** the user activates the pin control on a search result row that represents a whole document
- **THEN** the application SHALL invoke the same capture pipeline used for explicit `pinCapture` requests with `bodyKind` `document`, not `pinContent`-driven segment capture for determining `body_kind`

### Requirement: Document preview and full article expose Pin document

The **document preview** layout and the **full article** layout each SHALL expose an explicit control (e.g. “Pin document” or equivalent localized label) that creates a pin with the same persisted shape as search-hit whole-document pinning (`body_kind` `document`, required fields above).

#### Scenario: Preview and article both create document pins

- **WHEN** an authenticated user uses Pin document from document preview and separately from full article for the same logical document
- **THEN** each action SHALL insert a `human.pins` row with `body_kind` `document` and the correct `source_document_uid` for that document (multiple rows allowed; no deduplication required)

### Requirement: Pin board list supports filtering full papers

The pin board sidebar list (e.g. `BoardList.vue` or successor) SHALL provide a user-visible **filter or category** that restricts the list to pins where `body_kind === "document"`. The all-pins view SHALL remain available. Labels SHALL come from the application i18n system.

#### Scenario: Filter shows only document pins

- **WHEN** the user selects the full-paper filter
- **THEN** every listed pin SHALL have `body_kind` `document` and pins with other kinds SHALL not appear in that filtered list

#### Scenario: Localized kind label for document pins

- **WHEN** the UI displays a localized label for `body_kind` `document` in the same contexts as other kinds (e.g. section header, card chrome)
- **THEN** the UI SHALL resolve a `pins.kinds.*` key for `document` from locale files

### Requirement: Document and fragment pins may coexist per document

The same `source_document_uid` MAY appear on a `document` pin and on one or more fragment pins simultaneously. The application SHALL NOT require deduplication between `document` and fragment pins.

#### Scenario: Document pin and excerpt pin both listed

- **WHEN** a user has pinned the full document and also pinned a paragraph from that document
- **THEN** both pins SHALL appear in the unfiltered pin list (subject to sort order) and the full-paper filter SHALL show only the `document` row

### Requirement: Renderer registry supports document kind

The pin body renderer registry used by the pinboard (e.g. `PinBoardCard` or successor) SHALL register `body_kind` `document` so cards do not fall through to the unknown-kind fallback. The card SHALL show `source_title_snapshot`, navigation to the document when resolvable, `user_note` when non-empty per existing rules, and standard overflow actions consistent with other document-linked pins.

#### Scenario: Document pin is not unknown kind

- **WHEN** a pin has `body_kind` `document` and valid envelope `body.v === 1`
- **THEN** the pinboard SHALL NOT treat it as an unknown `body_kind` for rendering purposes
