# Explorer chat pin capture

Saving full chat threads and selection-based text pins from corpus chat surfaces in the explorer and pinboard.

## Requirements

### Requirement: User can save a full conversation snapshot to the pinboard

`ViewModeChat` SHALL expose a control to save the **entire current thread** as one pin with `body_kind` exactly `chat`.

The saved `body.data` SHALL include:

- `messages`: non-empty array of `{ role, text }` (or equivalent content fields) for every message in the thread at save time.
- `sourceView`: `"chat"`.
- `mode`: `"single"` or `"corpus"` reflecting how the chat was hosted.
- `citationsByMessageId`: optional map from assistant message id to citation arrays when corpus mode and citations exist.

Saving SHALL be disabled while a turn is streaming or submitted. Each save SHALL create a **new** pin (no in-place update of a prior conversation pin).

The capture dialog SHALL use the standard `PinCaptureDialog` flow (`usePin` / `buildPinCapturePayload`).

#### Scenario: User saves corpus conversation with citations

- **WHEN** an authenticated user saves a corpus chat thread that has at least one assistant message with citations
- **THEN** the created pin SHALL have `body_kind` `chat`, a `messages` array covering the full thread, and `citationsByMessageId` containing those citations keyed by message id

#### Scenario: Save blocked during streaming

- **WHEN** the chat status is `streaming` or `submitted`
- **THEN** the save-conversation control SHALL be disabled

#### Scenario: Pin renders on board

- **WHEN** the user views a pin with `body_kind` `chat` and valid `data.messages`
- **THEN** the pinboard SHALL render the thread using the chat pin renderer with distinguishable user vs assistant labels

### Requirement: Corpus chat supports selection-only text pinning

Explorer and pinboard fullscreen chat modals SHALL wrap `ViewModeChat` with `ArticleTextSelectionCapture` so the user can select arbitrary text in the chat area and pin it with `body_kind` `selected_text`, consistent with other explorer surfaces.

The pin payload SHALL include selected quote text and `sourceView` `"chat"`. Per-message pin affordances on user bubbles are not required.

#### Scenario: User pins selected text from corpus chat

- **WHEN** the user selects text inside the explorer chat modal and activates the floating pin control
- **THEN** the application SHALL open `PinCaptureDialog` with `body_kind` `selected_text` and save the selection on confirm

#### Scenario: Article single-document chat uses existing capture

- **WHEN** the user selects text in chat inside `ArticleViewAI`
- **THEN** pinning SHALL continue to work via the article wrapper without additional chat-specific capture wiring

### Requirement: Corpus chat catalog uses document_uid for article identification

When building the chat request catalog from search hits, `articleId` sent to `/api/chat` SHALL be `document.document_uid` when present, with `documentUid` set to the same value and `title` from the document. Internal hit UUIDs SHALL NOT be used as `articleId` when `document_uid` is available.

#### Scenario: Hit has document_uid

- **WHEN** a search hit includes `document.document_uid`
- **THEN** the catalog entry for that hit SHALL use that uid as both `articleId` and `documentUid`

### Requirement: Per-assistant-message chat_response pins remain supported

Existing `CapturableBlock` wrapping of assistant text parts with `body_kind` `chat_response` SHALL remain available in `ViewModeChat` alongside the new conversation snapshot and selection flows.

#### Scenario: User pins one AI paragraph

- **WHEN** the user pins a single assistant message part via the capturable hover control
- **THEN** the pin SHALL be created with `body_kind` `chat_response` as today

### Requirement: Chat pin card shows preview and opens full thread

On the pinboard, `body_kind` `chat` pins SHALL show a short markdown-rendered preview (first messages, clamped) and a control to open the full conversation in a fullscreen modal. The full view SHALL render all messages as markdown with stored citations when present.

#### Scenario: User opens full chat from pin card

- **WHEN** the user clicks the body of a chat pin card on the pinboard
- **THEN** the application SHALL open a fullscreen modal with the complete saved thread
