## ADDED Requirements

### Requirement: Podcast summarize endpoint validates selected context
The system SHALL expose `POST /api/podcast-summarize` for authenticated users. The endpoint MUST accept selected pin/document context and optional user instructions, reject empty selections, reject requests above configured selected-item or text-size limits, and return clear validation errors without calling the LLM when validation fails.

#### Scenario: Empty selection is rejected
- **WHEN** an authenticated user calls `POST /api/podcast-summarize` with no selected items
- **THEN** the endpoint MUST return a validation error
- **AND** the endpoint MUST NOT call Gemini

#### Scenario: Oversized context is rejected
- **WHEN** selected context exceeds the configured maximum item count or text-size limit
- **THEN** the endpoint MUST return a validation error explaining the limit that was exceeded
- **AND** the endpoint MUST NOT call Gemini

#### Scenario: Valid selection proceeds
- **WHEN** an authenticated user sends selected context within configured limits
- **THEN** the endpoint MUST assemble the LLM request from the selected item data and user instructions
- **AND** the endpoint MUST call the configured Gemini model

### Requirement: Podcast summarize preserves source boundaries
The summarize endpoint SHALL provide Gemini with structured context per selected source, including available title, pin id, body kind, source document uid, user note, selected text or markdown, and source text/fulltext. The prompt MUST ask for speech-friendly podcast script output suitable for user review.

#### Scenario: Prompt includes structured source blocks
- **WHEN** selected items contain titles, notes, markdown, quotes, or fulltext
- **THEN** the generated prompt MUST preserve each selected item as a distinct source block
- **AND** the prompt MUST include user-provided extra instructions when present

#### Scenario: Response is editable script text
- **WHEN** Gemini returns a successful podcast summary
- **THEN** the endpoint MUST return script text in a response shape that the frontend can place into an editable textarea
- **AND** the response MUST include enough metadata for debugging or display, such as source count and generated timestamp

### Requirement: Podcast text-to-speech endpoint creates an artifact
The system SHALL expose `POST /api/podcast-text-to-speech` for authenticated users. The endpoint MUST accept reviewed script text and project context, validate input length, synthesize MP3 audio using Google Cloud Text-to-Speech, upload the audio to Supabase Storage, and create a ready `human.artifacts` podcast row.

#### Scenario: Reviewed script generates podcast artifact
- **WHEN** an authenticated owner submits valid reviewed script text for a project they own
- **THEN** the endpoint MUST call Google Cloud Text-to-Speech with text or SSML input, voice configuration, and MP3 audio output
- **AND** the endpoint MUST upload the resulting audio to the artifact Storage bucket
- **AND** the endpoint MUST insert a `human.artifacts` row with `kind = 'podcast'` and `status = 'ready'`
- **AND** the endpoint MUST return the created artifact metadata

#### Scenario: Invalid script is rejected
- **WHEN** the reviewed script is empty or exceeds the configured text-to-speech limit
- **THEN** the endpoint MUST return a validation error
- **AND** the endpoint MUST NOT call Google Cloud Text-to-Speech

#### Scenario: User cannot create artifact for another project
- **WHEN** an authenticated user submits text-to-speech input for a project they do not own
- **THEN** the endpoint MUST deny the request
- **AND** no Storage object or artifact row MUST be created

### Requirement: Provider credentials stay server side
The podcast generation API SHALL use server-only runtime configuration for Gemini, Google Cloud Text-to-Speech, and any privileged Supabase Storage/database operations. The client MUST NOT receive or require Google credentials, Supabase service role keys, or other provider secrets.

#### Scenario: Client calls public server endpoints only
- **WHEN** the frontend starts podcast summarization or text-to-speech generation
- **THEN** it MUST call the Nuxt server endpoints
- **AND** it MUST NOT call Google Cloud Text-to-Speech or privileged Supabase APIs directly from the browser

### Requirement: Podcast API is testable with mocked providers
The system SHALL include automated tests for the podcast endpoints that mock Gemini, Google Cloud Text-to-Speech, Storage upload, and artifact insertion. Integration tests that require Supabase credentials MAY be skipped when required environment variables are absent, but skipped tests MUST document the missing configuration.

#### Scenario: Unit tests cover validation and orchestration
- **WHEN** the automated endpoint tests run without live provider credentials
- **THEN** validation failures, successful prompt assembly, TTS request shape, Storage upload calls, and artifact response shape MUST be testable through mocked dependencies

#### Scenario: Integration tests verify owner isolation when configured
- **WHEN** Supabase integration test credentials are configured
- **THEN** tests MUST verify that users cannot create or read podcast artifacts for projects owned by other users
