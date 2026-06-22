## MODIFIED Requirements

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
