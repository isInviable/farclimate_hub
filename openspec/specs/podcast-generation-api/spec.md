# podcast-generation-api Specification

## Purpose

Authenticated server APIs for generating editable podcast scripts from selected pinboard context and converting reviewed scripts into stored podcast audio artifacts.
## Requirements
### Requirement: Podcast summarize endpoint validates selected context
The system SHALL expose `POST /api/podcast-summarize` for authenticated users. The endpoint MUST accept selected pin/document context and optional user instructions, reject empty selections, and return clear validation errors without calling the LLM when validation fails. The endpoint MUST bound assembled context by a configured token budget (≈500,000 character-equivalent, tokens estimated as characters/4); when the budget is exceeded the endpoint MUST reduce fragment-backed source detail (full text → summary) via the shared degradation rather than rejecting the request, while never dropping verbatim user highlights or notes and never degrading full-document pins. If the context still exceeds the budget after all fragment-backed sources are summarized, the endpoint MUST return a validation error asking the user to reduce the selection.

#### Scenario: Empty selection is rejected
- **WHEN** an authenticated user calls `POST /api/podcast-summarize` with no selected items
- **THEN** the endpoint MUST return a validation error
- **AND** the endpoint MUST NOT call Gemini

#### Scenario: Oversized context degrades fragments before rejecting
- **WHEN** assembled context exceeds the configured token budget
- **THEN** the endpoint MUST degrade fragment-backed sources (full text → summary) until it fits, retaining verbatim highlights and notes
- **AND** the endpoint MUST NOT degrade full-document pins
- **AND** the endpoint MAY then call Gemini with the reduced context

#### Scenario: Still oversized after degradation is rejected
- **WHEN** the context still exceeds the budget after all fragment-backed sources are reduced to summaries
- **THEN** the endpoint MUST return a validation error indicating the selection is too large
- **AND** the endpoint MUST NOT call Gemini

#### Scenario: Valid selection proceeds
- **WHEN** an authenticated user sends selected context within configured limits
- **THEN** the endpoint MUST assemble the LLM request from the document-centric context and user instructions
- **AND** the endpoint MUST call the configured Gemini model

### Requirement: Podcast summarize preserves source boundaries
The summarize endpoint SHALL provide Gemini with document-centric structured context assembled by the shared context module. Fragments that share a `source_document_uid` MUST be merged into one source that includes the parent article content once, with each contributing pin attached as a provenance-labeled annotation. Each source MUST expose available title, source document uid, user note, the user's selected text framed as deliberate intent, and the surrounding article content as supporting context. The prompt MUST include guidance on weighting primary sources versus derived synthesis, exclude `contact`, `website`, and `image` pins from the podcast text, and ask for speech-friendly podcast script output suitable for user review.

#### Scenario: Prompt includes document-centric source blocks
- **WHEN** selected items contain titles, notes, markdown, quotes, or fulltext
- **THEN** the generated prompt MUST present one source block per source document, merging fragments that share a `source_document_uid`
- **AND** each block MUST label content provenance and frame highlights and notes as user intent
- **AND** the prompt MUST include user-provided extra instructions when present

#### Scenario: Highlight includes surrounding article context
- **WHEN** a selected highlight has a `source_document_uid`
- **THEN** the prompt block MUST include the full article text as supporting context
- **AND** the prompt MUST frame the highlighted passage as the part the user deliberately selected

#### Scenario: Non-text pin kinds are excluded
- **WHEN** the selection contains `contact`, `website`, or `image` pins
- **THEN** those pins MUST NOT contribute text to the podcast prompt

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

