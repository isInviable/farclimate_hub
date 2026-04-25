## ADDED Requirements

### Requirement: Grid compare summary pins use a dedicated body_kind

The application SHALL support a dedicated `body_kind` for pins created from the Explorer grid comparison view (e.g. `grid_compare_summary`) that is distinct from `ai_summary`, `chat_response`, and generic `text_segment`. The pinboard SHALL render this kind with the same text-oriented renderer as other markdown-capable pin bodies unless a specialized layout is introduced later, and the localized kind label (`pins.kinds.*`) SHALL be present when other kinds expose labels in the same UI.

#### Scenario: Create pin from grid cell

- **WHEN** an authenticated user saves a pin from a grid compare capturable with structured payload fields for that cell
- **THEN** the insert SHALL set `body_kind` to the grid-compare dedicated value and `body.data` SHALL include the captured summary content and mode metadata as defined in `explorer-viewmode-grid-compare`

#### Scenario: Board lists grid compare pin

- **WHEN** the pinboard shows a pin with the grid-compare `body_kind`
- **THEN** the card SHALL render the pin body without error and SHALL show the appropriate kind label alongside other `body_kind` labels in that view

### Requirement: Explorer grid compare provides source document when known

When pin creation is initiated from the Explorer grid comparison view and the search hit’s document provides `document_uid`, the client SHALL populate `source_document_uid` and `source_title_snapshot` on the new `human.pins` row. The `source_title_snapshot` SHOULD combine the document title with a short grid-specific descriptor (e.g. compare mode or property label) when such metadata improves recognition on the board.

#### Scenario: Grid pin links to Explorer

- **WHEN** a grid compare pin is created with a known `document_uid`
- **THEN** the pinboard SHALL offer the same “open in explorer” / document navigation behavior as other article-linked pins, subject to document resolution rules already defined for `human.pins` rows
