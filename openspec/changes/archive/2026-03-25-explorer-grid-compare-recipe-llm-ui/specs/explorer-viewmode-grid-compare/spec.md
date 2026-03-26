# Explorer view mode: grid compare (delta)

## ADDED Requirements

### Requirement: Bounded comparison source from recipe or short fields

The grid comparison feature SHALL resolve display and LLM input text from data already present on each search hit’s `document`: `subtitle`, `summary`, and optional `recipe_ingredients` (object of string keys to markdown strings). It SHALL NOT rely on legacy flat fields (`cost_benefit`, `implementation_time`, `lifetime`, `stakeholder_participation`, `success_limitations`) unless those fields are explicitly added back to the search API contract.

Predefined comparison options (other than the short “subtitle / summary” path) SHALL map to canonical recipe keys as follows: economic comparison → `economic_data`; implementation timing → `implementation_phases`; lifetime / durability framing → `benefits`; stakeholder involvement → `who_is_involved`; success and limitations → `success_and_limiting`. The option that shows the concise subtitle SHALL use `document.subtitle` only and SHALL NOT call the summarize API.

#### Scenario: Predefined option uses recipe section

- **WHEN** the user selects a predefined comparison option that maps to recipe key `economic_data` and the hit’s `document.recipe_ingredients.economic_data` is a non-empty string
- **THEN** the client SHALL use that string as the bounded source text for the summarize request for that hit

#### Scenario: Missing recipe section

- **WHEN** the user selects a predefined option whose mapped recipe value is missing or empty
- **THEN** the client SHALL NOT call the summarize API for that hit and SHALL show a clear empty-state or fallback snippet from other available short fields only (without sending full `fulltext` to the LLM for that purpose)

### Requirement: LLM produces short comparable blurbs

When the summarize API is invoked for a predefined property, the handler SHALL send only the provided bounded `text` (and metadata) to the LLM, not the full article `fulltext`. The model output SHALL remain suitable for side-by-side review: approximately one to two sentences for the main summary, with important **keywords** and **numeric figures** emphasized (e.g. markdown bold), consistent with the existing structured fields (`title`, `summary`, `data`).

#### Scenario: Long section input

- **WHEN** the bounded source text is multiple paragraphs long
- **THEN** the response SHALL still be a short comparison blurb (about one to two sentences for the narrative summary) and SHALL surface key figures in the structured `data` field when present in the source

### Requirement: Custom user comparison prompt

The grid SHALL offer a dropdown option that reveals a text field where the user types what they want to compare across the displayed articles. When that mode is active and the user has entered a non-empty prompt, the client SHALL call the summarize API for each hit with the same user instruction and a bounded per-document context derived from the hit’s `document` (at minimum title and subtitle; additional fields such as `summary` and/or non-empty recipe sections MAY be included only within a documented character budget). The full `fulltext` field SHALL NOT be sent as the primary context for this mode.

#### Scenario: Custom mode with prompt

- **WHEN** the user selects the custom comparison option and enters a non-empty prompt
- **THEN** the client SHALL request a summarized answer per hit that addresses that prompt using the bounded context for that hit

#### Scenario: Custom mode prompt empty

- **WHEN** the custom comparison option is selected but the prompt is empty or whitespace-only
- **THEN** the client SHALL NOT call the summarize API for comparison and SHALL not show loading spinners for LLM work

### Requirement: Nuxt UI for grid controls

The grid comparison view SHALL use Nuxt UI components for interactive controls (select, buttons, text entry, pagination when present) in line with project standards. Raw HTML `<button>` elements used only as styled placeholders SHALL be replaced with Nuxt UI equivalents (e.g. `UButton`, `UPagination`, or disabled `UButton` with icons) so styling and accessibility match the rest of the explorer.

#### Scenario: Custom prompt visible

- **WHEN** the user selects the custom comparison option
- **THEN** the text entry SHALL be implemented with Nuxt UI form controls (e.g. `UTextarea` within `UFormField`)

### Requirement: Summarize API supports property and custom modes

The Nuxt server route `POST /api/summarizeProperty` SHALL accept a JSON body that includes at least: `text` (bounded excerpt), `cacheId` (string), and `mode` with values `property` or `custom`. For `mode: property`, the body SHALL include `property` identifying the predefined comparison key. For `mode: custom`, the body SHALL include `userPrompt` (non-empty string). The handler SHALL reject missing required fields with HTTP 400. It SHALL pass only the supplied bounded `text` (plus instruction fields) to the LLM, not an entire article body supplied by the client as an unbounded dump.

#### Scenario: Custom mode request

- **WHEN** the client POSTs `{ "mode": "custom", "userPrompt": "What was the main cost?", "text": "<bounded context>", "cacheId": "..." }`
- **THEN** the handler SHALL generate a structured short answer appropriate for grid display and SHALL return the same response shape as property mode (`response` object with `title`, `summary`, `data`)

#### Scenario: Invalid custom body

- **WHEN** the client POSTs `mode: custom` with missing or empty `userPrompt`
- **THEN** the handler SHALL respond with HTTP 400
