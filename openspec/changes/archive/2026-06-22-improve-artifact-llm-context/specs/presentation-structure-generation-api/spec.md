## MODIFIED Requirements

### Requirement: Generated slides preserve debug source references
The endpoint SHALL preserve selected source boundaries in the LLM prompt using the shared document-centric context-assembly module and MAY include source reference identifiers in the generated presentation JSON for debugging. The prompt MUST group fragments by source document, label each piece of content with its provenance, frame user highlights and notes as deliberate user intent, and include guidance on how the model should weight primary sources versus derived synthesis. Source references MUST be treated as debug metadata and MUST NOT be required for user-facing citation display in this stage.

#### Scenario: Prompt includes document-centric source blocks
- **WHEN** selected items contain titles, notes, markdown, quotes, body data, image metadata, or source document identifiers
- **THEN** the generated prompt MUST present one source block per source document, merging fragments that share a `source_document_uid`
- **AND** each block MUST label content provenance (primary source, user highlight, user note, derived synthesis, visual asset)
- **AND** the prompt MUST include user-provided instructions when present

#### Scenario: Highlight includes surrounding article context
- **WHEN** a selected highlight has a `source_document_uid`
- **THEN** the prompt block MUST include the full article text as supporting context
- **AND** the prompt MUST frame the highlighted passage as the part the user deliberately selected

#### Scenario: Slide includes debug source references
- **WHEN** the LLM can associate a slide with selected input sources
- **THEN** the returned slide MAY include debug source reference identifiers
- **AND** those identifiers MUST refer only to selected input sources

### Requirement: Presentation structure endpoint validates selected context
The system SHALL expose an authenticated Nuxt server endpoint for generating presentation structures from selected pinboard or content context. The endpoint MUST accept selected items and optional user instructions, reject empty selections, and return clear validation errors without calling the LLM when validation fails. The endpoint MUST bound assembled context by a configured token budget (≈500,000 character-equivalent, tokens estimated as characters/4); when the budget is exceeded the endpoint MUST reduce fragment-backed source detail (full text → summary) via the shared degradation rather than rejecting the request, while never dropping verbatim user highlights or notes and never degrading full-document pins. If the context still exceeds the budget after all fragment-backed sources are summarized, the endpoint MUST return a validation error asking the user to reduce the selection.

#### Scenario: Empty selection is rejected
- **WHEN** an authenticated user calls the presentation structure endpoint with no selected items
- **THEN** the endpoint MUST return a validation error
- **AND** the endpoint MUST NOT call the LLM provider

#### Scenario: Oversized context degrades fragments before rejecting
- **WHEN** assembled context exceeds the configured token budget
- **THEN** the endpoint MUST degrade fragment-backed sources (full text → summary) until it fits, retaining verbatim highlights and notes
- **AND** the endpoint MUST NOT degrade full-document pins
- **AND** the endpoint MAY then call the LLM provider with the reduced context

#### Scenario: Still oversized after degradation is rejected
- **WHEN** the context still exceeds the budget after all fragment-backed sources are reduced to summaries
- **THEN** the endpoint MUST return a validation error indicating the selection is too large
- **AND** the endpoint MUST NOT call the LLM provider

#### Scenario: Valid selection proceeds
- **WHEN** an authenticated user sends selected context within configured limits
- **THEN** the endpoint MUST assemble the LLM request from the document-centric context and optional user instructions
- **AND** the endpoint MUST call the configured LLM provider
