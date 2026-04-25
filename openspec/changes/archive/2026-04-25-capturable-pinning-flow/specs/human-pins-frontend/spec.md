## ADDED Requirements

### Requirement: Capturable blocks replace cosmetic block selection

Article capture surfaces SHALL use an explicit capture action instead of click-to-select behavior. A capturable block wrapper MAY wrap arbitrary rendered content through its default slot, SHALL render a default pin/capture control when capture is enabled, and SHALL allow callers to replace that control through a named slot or equivalent component API.

#### Scenario: Block click does not toggle selection

- **WHEN** a user clicks the body of a capturable article block
- **THEN** the application SHALL NOT toggle a local selected ring or selected state unless that click activates a real product action

#### Scenario: Default capture control is available

- **WHEN** a capturable block is rendered with capture enabled and no custom pin slot
- **THEN** the block SHALL expose a visible or discoverable capture control that opens the pin capture flow

#### Scenario: Custom capture control is supported

- **WHEN** a consumer provides a custom pin slot/control for a capturable block
- **THEN** the custom control SHALL receive the information needed to open the capture flow and reflect saving or pinned state

### Requirement: Captures use explicit structured payloads

The pin creation flow for supported article-hosted captures SHALL persist explicit structured payloads in `human.pins.body.data` rather than deriving primary content from rendered DOM text. Each capture request SHALL include a `body_kind`, title or label, and payload appropriate to the captured content. DOM-derived text MAY be used only as a fallback for generic or legacy capture surfaces.

#### Scenario: Recipe section capture stores section metadata

- **WHEN** a user captures a recipe section from the structured article view
- **THEN** the created pin SHALL include a `body_kind` identifying the section-like content and `body.data` SHALL include the section key and markdown/content used to render that section

#### Scenario: Image capture stores image metadata

- **WHEN** a user captures an image from an article capture surface
- **THEN** the created pin SHALL include image-specific `body.data` such as source URL or storage pointer metadata and alt/title metadata when available

#### Scenario: AI-generated content capture stores generated content explicitly

- **WHEN** a user captures an AI-generated summary or chatbot response from a supported article surface
- **THEN** the created pin SHALL store the generated text or message payload explicitly in `body.data`, along with a kind or metadata that distinguishes it from ordinary article text

### Requirement: Pin creation accepts an optional user note

The article capture flow SHALL let the user add an optional note before saving a new pin. The note SHALL be persisted to `human.pins.user_note` during the create operation. Empty notes SHALL be persisted consistently with existing update-note conventions.

#### Scenario: User saves a capture with a note

- **WHEN** a user opens the capture flow, enters a note, and confirms save
- **THEN** the created pin SHALL include the note in `user_note` and the board SHALL render that note wherever pin notes are displayed

#### Scenario: User saves a capture without a note

- **WHEN** a user confirms a capture without entering a note
- **THEN** the created pin SHALL still be created and `user_note` SHALL be empty or null per existing pin update conventions

#### Scenario: User cancels capture

- **WHEN** a user opens the capture flow and cancels before confirming
- **THEN** no `human.pins` insert SHALL be sent

### Requirement: Article text selection can be captured

Supported article reading surfaces SHALL allow users to select non-empty text inside the article container and open the same note-capable pin capture flow for that selected quote. Selected text captures SHALL preserve the parent article source context when available.

#### Scenario: User captures selected article text

- **WHEN** a user selects text inside a supported article reading container and activates the selected-text capture action
- **THEN** the created pin SHALL include the selected quote in `body.data` and SHALL include the parent article `source_document_uid` when the article context is known

#### Scenario: Selection outside the article is ignored

- **WHEN** a user selects text outside the supported article reading container
- **THEN** the article selected-text capture action SHALL NOT create a pin for that selection

#### Scenario: Empty selection is ignored

- **WHEN** the current selection is empty or whitespace-only
- **THEN** the selected-text capture action SHALL remain hidden or disabled and no pin SHALL be created

### Requirement: Article-hosted captures preserve source context

All captures created from article-hosted surfaces, including capturable blocks and selected text, SHALL populate `source_document_uid`, `source_title_snapshot`, and valid `body.data.location` using the same parent article context rules as existing article block pins.

#### Scenario: Capturable block preserves article source

- **WHEN** a user captures a block inside an article view whose `document_uid` is known
- **THEN** the created pin SHALL include that `document_uid` as `source_document_uid` and a `source_title_snapshot` that includes the article title and captured block label when available

#### Scenario: Selected text preserves article source

- **WHEN** a user captures selected text inside an article view whose `document_uid` is known
- **THEN** the created pin SHALL include that `document_uid` as `source_document_uid` and a `source_title_snapshot` that identifies the article and selected-text capture

#### Scenario: Valid article location is snapshotted

- **WHEN** a user creates any article-hosted capture and the parent article has a valid non-placeholder `[latitude, longitude]` location
- **THEN** the created pin SHALL include that tuple in `body.data.location`

### Requirement: New capture body kinds render safely

The pinboard frontend SHALL render body kinds introduced by this capture flow through explicit render mappings when available and through the existing safe fallback when unavailable. Unknown body kinds SHALL NOT break the pin list, board card menu, note rendering, source navigation, or map grouping behavior.

#### Scenario: Known new body kind renders with appropriate preview

- **WHEN** the board displays a pin created from selected text, a recipe section, an AI summary, or a chat response and a renderer exists for that `body_kind`
- **THEN** the card SHALL show an appropriate preview using `body.data` and SHALL still show `user_note` when non-empty

#### Scenario: Unknown new body kind falls back safely

- **WHEN** the board displays a pin whose `body_kind` has no specific renderer
- **THEN** the card SHALL render a safe generic preview and keep board interactions usable
