## ADDED Requirements

### Requirement: Chat API streams UI messages

The system SHALL expose `POST /api/chat` that accepts a JSON body with a `messages` array in AI SDK UI message form (including `parts` per message) and an optional `documents` string array. The handler SHALL respond with an HTTP streaming body compatible with `@ai-sdk/vue` `Chat` (UI message stream), not the legacy data stream helper.

#### Scenario: Successful assistant reply

- **WHEN** the client sends a valid `messages` array and optional `documents`
- **THEN** the server SHALL invoke the configured Gemini model with a system prompt that includes joined `documents` when provided
- **AND** the response SHALL be a UI message stream the client can consume until completion

### Requirement: Chat API converts UI messages for the model

The system SHALL convert incoming UI messages to model messages using the Vercel AI SDK before calling `streamText`, so roles and multimodal `parts` are interpreted correctly.

#### Scenario: Multi-turn conversation

- **WHEN** the client sends multiple user and assistant UI messages
- **THEN** the server SHALL pass the converted history to the model without requiring the client to send a different wire format

### Requirement: Explorer chat UI uses Nuxt UI chat components

The explorer document chat view SHALL render the conversation using Nuxt UI chat primitives (e.g. message list and per-message components documented for AI SDK `parts`), not ad hoc flex bubbles, while preserving existing behavior (example questions, input, send, loading state).

#### Scenario: User sees aligned chat layout

- **WHEN** the user opens the document chat view and sends a message
- **THEN** user messages SHALL appear on the expected side and assistant messages on the opposite side per Nuxt UI chat defaults
- **AND** text parts SHALL be visible as the stream arrives

### Requirement: Optional document context is preserved

The system SHALL continue to accept `documents` in the POST body from the client and SHALL inject that content into the system prompt so answers remain scoped to supplied article context when present.

#### Scenario: Chat with explorer context

- **WHEN** `ViewModeChat` sends `documents` built from the selected article or hits
- **THEN** the model SHALL receive that context in the system prompt in addition to the climate-adaptation instructions
