## ADDED Requirements

### Requirement: Presentation structure endpoint validates selected context
The system SHALL expose an authenticated Nuxt server endpoint for generating presentation structures from selected pinboard or content context. The endpoint MUST accept selected items and optional user instructions, reject empty selections, reject requests above configured selected-item or text-size limits, and return clear validation errors without calling the LLM when validation fails.

#### Scenario: Empty selection is rejected
- **WHEN** an authenticated user calls the presentation structure endpoint with no selected items
- **THEN** the endpoint MUST return a validation error
- **AND** the endpoint MUST NOT call the LLM provider

#### Scenario: Oversized context is rejected
- **WHEN** selected context exceeds the configured maximum item count or text-size limit
- **THEN** the endpoint MUST return a validation error explaining the exceeded limit
- **AND** the endpoint MUST NOT call the LLM provider

#### Scenario: Valid selection proceeds
- **WHEN** an authenticated user sends selected context within configured limits
- **THEN** the endpoint MUST assemble the LLM request from the selected item data and optional user instructions
- **AND** the endpoint MUST call the configured LLM provider

### Requirement: Presentation generation supports bounded user instructions
The endpoint SHALL support optional user instructions for presentation generation, including tone, language, audience, and requested slide count. The endpoint MUST enforce a maximum of 10 generated slides regardless of user instructions, with the limit implemented as a constant or configuration value that can be made configurable later.

#### Scenario: User asks for an executive Spanish presentation
- **WHEN** the request includes instructions such as executive tone and Spanish language
- **THEN** the endpoint MUST include those instructions in the LLM request
- **AND** the endpoint MUST still validate the final response against the presentation schema

#### Scenario: User requests too many slides
- **WHEN** the request asks for more than 10 slides
- **THEN** the endpoint MUST cap or reject the request according to the implemented validation contract
- **AND** the LLM request MUST NOT ask for more than 10 slides

#### Scenario: LLM returns too many slides
- **WHEN** the LLM response contains more than 10 slides
- **THEN** the endpoint MUST reject the response as invalid or normalize it according to documented validation behavior before returning to the client

### Requirement: Presentation response uses a controlled slide schema
The endpoint SHALL return a validated presentation JSON object with a top-level title, optional subtitle, and ordered slides. Each slide MUST use one of the supported slide types: `cover`, `bullets`, `image-title`, or `image-bullets`. The schema MUST NOT allow layout implementation details such as x/y coordinates, fonts, colors, dimensions, or PptxGenJS-specific options.

#### Scenario: Cover slide is returned
- **WHEN** the LLM chooses a cover slide
- **THEN** the slide MUST contain `type = "cover"` and a non-empty title
- **AND** the slide MAY contain a subtitle

#### Scenario: Bullet slide is returned
- **WHEN** the LLM chooses a title plus bullet points slide
- **THEN** the slide MUST contain `type = "bullets"`, a non-empty title, and at least one bullet string

#### Scenario: Image title slide is returned
- **WHEN** the LLM chooses an image with title slide
- **THEN** the slide MUST contain `type = "image-title"`, a non-empty title, and an image reference to selected content

#### Scenario: Image bullet slide is returned
- **WHEN** the LLM chooses a title plus image and bullet points slide
- **THEN** the slide MUST contain `type = "image-bullets"`, a non-empty title, an image reference to selected content, and at least one bullet string

#### Scenario: Layout fields are rejected
- **WHEN** the LLM response includes coordinates, font definitions, color tokens, slide dimensions, or PptxGenJS call options
- **THEN** the endpoint MUST reject those fields or strip them according to documented validation behavior
- **AND** the returned JSON MUST contain only schema-approved content fields

### Requirement: Image slide types require selected usable images
The endpoint SHALL allow image-based slide types only when the selected context includes at least one usable image source. Image references in generated slides MUST resolve to selected input content and MUST NOT be invented by the LLM.

#### Scenario: No usable images are selected
- **WHEN** selected context does not include usable image sources
- **THEN** the LLM request MUST instruct the provider not to emit image-based slide types
- **AND** the endpoint MUST reject any returned `image-title` or `image-bullets` slide

#### Scenario: Usable image is selected
- **WHEN** selected context includes a usable image source
- **THEN** the LLM request MAY allow image-based slide types
- **AND** any returned image reference MUST identify selected input content

#### Scenario: LLM invents an image reference
- **WHEN** the LLM response references an image source that was not part of the selected input
- **THEN** the endpoint MUST reject the response as invalid

### Requirement: Generated slides preserve debug source references
The endpoint SHALL preserve selected source boundaries in the LLM prompt and MAY include source reference identifiers in the generated presentation JSON for debugging. Source references MUST be treated as debug metadata and MUST NOT be required for user-facing citation display in this stage.

#### Scenario: Prompt includes structured source blocks
- **WHEN** selected items contain titles, notes, markdown, quotes, body data, image metadata, or source document identifiers
- **THEN** the generated prompt MUST preserve each selected item as a distinct source block
- **AND** the prompt MUST include user-provided instructions when present

#### Scenario: Slide includes debug source references
- **WHEN** the LLM can associate a slide with selected input sources
- **THEN** the returned slide MAY include debug source reference identifiers
- **AND** those identifiers MUST refer only to selected input sources

### Requirement: Provider credentials stay server side
The presentation structure generation API SHALL use server-only runtime configuration for the LLM provider. The client MUST NOT receive or require provider API keys, service role keys, or other privileged credentials.

#### Scenario: Client calls application endpoint only
- **WHEN** the frontend starts presentation structure generation
- **THEN** it MUST call the Nuxt server endpoint
- **AND** it MUST NOT call the LLM provider directly from the browser

### Requirement: Presentation generation is testable with mocked providers
The system SHALL include automated tests for presentation structure generation that mock the LLM provider. Tests MUST cover validation failures, prompt assembly, instruction handling, slide-count limits, image gating, schema validation, and provider success/failure paths.

#### Scenario: Unit tests cover validation and orchestration
- **WHEN** automated tests run without live provider credentials
- **THEN** request validation, prompt construction, mocked provider calls, response parsing, and schema validation MUST be testable through mocks

#### Scenario: Provider failure returns safe error
- **WHEN** the LLM provider fails or returns invalid JSON
- **THEN** the endpoint MUST return a safe error response
- **AND** the response MUST NOT leak provider credentials, raw secrets, or unsafe internal details
