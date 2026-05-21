# Explorer chat citations

Structured per-response citations from `POST /api/chat` for multi-article (corpus) explorer and pinboard chat, plus UI to view and open cited papers.

## Requirements

### Requirement: Chat API accepts document catalog and mode

`POST /api/chat` SHALL accept a request body that includes:

- `messages`: array of UI messages (existing behavior).
- `mode`: either `single` or `corpus`.
- `catalog`: optional array of `{ articleId: string, documentUid: string, title: string }` describing every document in scope for the request.

When `catalog` is provided, the server SHALL build model context from the corresponding document text blobs and SHALL label each document in the prompt using `articleId` from the catalog entry. For corpus mode, `articleId` SHALL be the stable `document_uid` when available.

The server SHALL remain backward compatible when `catalog` is omitted by continuing to accept `documents: string[]` as today.

#### Scenario: Corpus request includes catalog

- **WHEN** the client posts `mode: corpus` with a non-empty `catalog` and valid `messages`
- **THEN** the server SHALL include each catalog document in the system context and SHALL use each entry's `articleId` in the prompt for identification

#### Scenario: Single-article request

- **WHEN** the client posts `mode: single` with one catalog entry or legacy single-document blobs
- **THEN** the server SHALL answer using that document context and SHALL NOT require citation metadata in the response for correctness

### Requirement: Chat API returns validated citations per assistant turn

For `mode: corpus`, after the assistant response stream completes, the server SHALL produce a citation list for that turn: an array of catalog entries (or `{ articleId, documentUid, title }`) that the model marked as used to form the answer.

Every returned `articleId` MUST exist in the request `catalog`. IDs not in the catalog SHALL be discarded. Duplicate IDs SHALL be deduplicated.

The server SHALL deliver citations to the client in a form the chat UI can attach to the corresponding assistant message (e.g. message metadata or an approved custom stream data part). Citations MAY be empty when the model indicates no specific paper applied.

#### Scenario: Model cites subset of catalog

- **WHEN** the citation extraction returns two valid article IDs that exist in the catalog
- **THEN** the client SHALL receive exactly those two citations with matching `documentUid` and `title` from the catalog

#### Scenario: Model returns unknown article ID

- **WHEN** the citation extraction returns an ID not present in the catalog
- **THEN** that ID SHALL NOT appear in the citation list sent to the client

#### Scenario: Streaming completes before citations

- **WHEN** the assistant message is still streaming
- **THEN** the client SHALL NOT show final citation chips for that message

### Requirement: Corpus chat shows collapsible citation chips under assistant messages

In `ViewModeChat` when `mode` is `corpus`, each completed assistant message that has one or more citations SHALL show a citation control below the message body.

The control SHALL default to collapsed and SHALL display the number of cited articles (localized). Expanding the control SHALL list each cited article by title. Each title SHALL be activatable.

When a message has zero citations after extraction, the citation control SHALL NOT be shown.

#### Scenario: User expands citations

- **WHEN** the user expands the citation control on an assistant message with three citations
- **THEN** the UI SHALL show three clickable article titles matching the citation list

#### Scenario: Single-article chat hides citations

- **WHEN** `ViewModeChat` is rendered with a single `document` prop (article view)
- **THEN** citation chips SHALL NOT be rendered for any message

### Requirement: User can open a cited article from corpus chat

Activating a citation title in corpus chat SHALL open the corresponding knowledge document in the explorer using `documentUid` (e.g. explorer deep link `?document=<documentUid>` or the explorer side-panel document opener with the same uid).

#### Scenario: User clicks citation in explorer chat modal

- **WHEN** the user clicks a citation title while chat is open from the explorer search modal
- **THEN** the application SHALL open that document in the explorer article experience using its `document_uid`

#### Scenario: User clicks citation in pinboard chat modal

- **WHEN** the user clicks a citation title while chat is open from the pinboard
- **THEN** the application SHALL navigate to or open that document in the explorer by `document_uid`
