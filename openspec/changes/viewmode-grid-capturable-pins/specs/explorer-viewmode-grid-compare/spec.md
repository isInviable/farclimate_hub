## ADDED Requirements

### Requirement: Grid layout supports variable-height compare cards

The grid comparison view SHALL use a masonry-like layout (for example CSS multi-column with `break-inside-avoid` on each card, or an equivalent documented approach) so that cards with longer AI or subtitle content can grow vertically without being forced to a single row height. The implementation SHALL NOT rely solely on `line-clamp` or other truncation to fit content into a fixed-height row when the user is reviewing full compare blurbs, except where an explicit "short preview" product requirement exists for a specific mode.

#### Scenario: Long blurb is visible in the cell

- **WHEN** a compare cell contains multi-line markdown from the summarize response or a long subtitle fallback
- **THEN** the cell SHALL expand vertically within the masonry layout and the full text SHALL be visible without an arbitrary line clamp whose sole purpose is to match a uniform grid row height

### Requirement: Grid uses capturable pin flow for cell content

The grid comparison view SHALL NOT use the legacy `Pin` component (`apps/web/app/components/explorer/ui/pin/Pin.vue`) for pinning cell content. Pinning SHALL use the same capturable flow as other modern Explorer surfaces: explicit capture control, `PinCaptureDialog` with optional note, and structured persistence to `human.pins`. Any previous stub handlers (e.g. console-only pinned/unpinned callbacks) SHALL be removed from this view.

#### Scenario: User initiates pin from a compare cell

- **WHEN** an authenticated user uses the pin control on a grid cell
- **THEN** the application SHALL open the standard capture dialog and, on save, SHALL create a pin with a dedicated `body_kind` for grid compare summary (not ad hoc DOM-scraped content from the legacy `Pin` component)

### Requirement: Grid capturable provides article source context

For each search hit, the view SHALL supply `PinArticleContext` (or equivalent) to nested capturable components when the hit’s document exposes a stable `document_uid`, so created pins set `source_document_uid` and `source_title_snapshot` in line with `human-pins-frontend` rules. When `document_uid` is missing, the client SHALL follow the spec for pins without a linked source document.

#### Scenario: Pin from a hit with document UID

- **WHEN** the user saves a pin from a grid cell whose document includes `document_uid`
- **THEN** the insert payload SHALL include that value as `source_document_uid` and a meaningful `source_title_snapshot` (at least the article title)

#### Scenario: Pin from a hit without document UID

- **WHEN** the hit does not provide `document_uid`
- **THEN** the pin SHALL still be creatable and the board SHALL reflect the standard degraded / missing-source behavior for that row

### Requirement: Grid pin payload encodes compare mode and summary fields

The structured `body.data` for a grid-compare pin SHALL include the summarize output used for that cell (at minimum the `data` and `summary` string fields from the API when present), together with machine-usable mode metadata: predefined property key and/or custom mode with a stable identifier for the current user prompt, so the pin can be understood outside the original grid session. The `body_kind` value SHALL be distinct for grid-compare AI/summary cells as specified in the `human-pins-frontend` delta for this change.

#### Scenario: Custom compare pin retains prompt identity

- **WHEN** the user is in custom compare mode and pins a cell after submitting a custom prompt
- **THEN** `body.data` SHALL allow distinguishing which prompt and response snapshot was captured (e.g. hashed prompt id and/or stored prompt string per product choice), in addition to the summary fields
