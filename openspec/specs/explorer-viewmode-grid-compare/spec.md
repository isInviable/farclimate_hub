# Explorer view mode: grid compare

Grid comparison in the explorer SHALL use bounded text (recipe sections and short fields), optional LLM compression, a custom-question mode, batch server API with parallel model calls, and a hard cap on how many articles are summarized per action to control token cost.

---

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

When the summarize API is invoked for a predefined property, the handler SHALL send only the provided bounded `text` (and metadata) to the LLM, not the full article `fulltext`. The model output SHALL remain suitable for side-by-side review: a short main summary with important **keywords** and **numeric figures** emphasized (e.g. markdown bold). The structured response SHALL expose at least `summary` and `data` string fields for grid rendering.

#### Scenario: Long section input

- **WHEN** the bounded source text is multiple paragraphs long
- **THEN** the response SHALL still be a short comparison blurb and SHALL surface key figures in the structured `data` field when present in the source

### Requirement: Property-specific prompts without in-prompt branching

Server-side property-mode prompts SHALL be composed from shared instructions plus a dedicated task paragraph per predefined `property` key (e.g. `cost_benefit`, `implementation_time`). The model-facing text SHALL NOT use conditional “if property is X” lists; routing to the correct instructions SHALL be implemented in application code (e.g. a map from property key to prompt builder).

#### Scenario: Known property key

- **WHEN** the client sends `mode: property` with a known comparison key such as `cost_benefit`
- **THEN** the server SHALL use the prompt variant tailored to that aspect (costs/benefits focus and data-field guidance) together with the shared formatting rules

### Requirement: Custom user comparison prompt

The grid SHALL offer a dropdown option that reveals a text field where the user types what they want to compare across articles. Custom mode SHALL require an explicit user action (e.g. a **Compare** button or equivalent) to request summaries; the client SHALL NOT auto-fire the LLM on every keystroke alone. When the user submits with a non-empty prompt, the client SHALL request a summarized answer per targeted hit using the same instruction and bounded per-document context derived from the hit’s `document` (title, subtitle, summary, and non-empty recipe sections within a documented character budget). The full `fulltext` field SHALL NOT be sent as the primary context for this mode.

#### Scenario: Custom mode with submitted prompt

- **WHEN** the user selects the custom comparison option, enters a non-empty prompt, and submits
- **THEN** the client SHALL request a summarized answer per included hit that addresses that prompt using the bounded context for that hit

#### Scenario: Custom mode prompt empty

- **WHEN** the custom comparison option is selected but the prompt is empty or whitespace-only
- **THEN** the client SHALL NOT call the summarize API for comparison and SHALL NOT show loading spinners for LLM work for that action

### Requirement: Nuxt UI for grid controls

The grid comparison view SHALL use Nuxt UI components for interactive controls (select, buttons, text entry, **and pagination**) in line with project standards. Pagination SHALL be functional: it SHALL reflect the real number of pages for the current filtered result set and SHALL change which hits are rendered when the user changes page. The shared explorer results toolbar pattern (`explorer-results-view-controls`) SHALL be used for pagination and bulk selection controls so behavior matches other viewmodes. Raw HTML `<button>` elements used only as styled placeholders SHALL be replaced with Nuxt UI equivalents (e.g. `UButton` with icons) so styling and accessibility match the rest of the explorer.

#### Scenario: Custom prompt visible

- **WHEN** the user selects the custom comparison option
- **THEN** the text entry SHALL be implemented with Nuxt UI form controls (e.g. `UTextarea` within `UFormField`)

#### Scenario: Pagination navigates grid rows

- **WHEN** the filtered result set is larger than one page and the user moves to the next page
- **THEN** the grid SHALL render the hits belonging to that page and pagination controls SHALL remain enabled or disabled according to position (not globally disabled)

### Requirement: Summarize API supports property and custom modes

The Nuxt server route `POST /api/summarizeProperty` SHALL accept a JSON body that includes at least: `text` (bounded excerpt), `cacheId` (string), and `mode` with values `property` or `custom`. For `mode: property`, the body SHALL include `property` identifying the predefined comparison key. For `mode: custom`, the body SHALL include `userPrompt` (non-empty string). The handler SHALL reject missing required fields with HTTP 400. It SHALL pass only the supplied bounded `text` (plus instruction fields) to the LLM. Structured generation SHALL use the current AI SDK pattern (`generateText` with an `output` object schema), not deprecated `generateObject`-only flows.

#### Scenario: Custom mode request

- **WHEN** the client POSTs `{ "mode": "custom", "userPrompt": "…", "text": "<bounded context>", "cacheId": "…" }`
- **THEN** the handler SHALL generate a structured short answer appropriate for grid display and SHALL return a `response` object including `summary` and `data` (and `timestamp` metadata as implemented)

#### Scenario: Invalid custom body

- **WHEN** the client POSTs `mode: custom` with missing or empty `userPrompt`
- **THEN** the handler SHALL respond with HTTP 400

### Requirement: Batch summarize route and parallel LLM calls

The system SHALL provide `POST /api/summarizePropertyBatch` that accepts a single JSON body with shared `mode`, optional `property` or `userPrompt`, and an `items` array of `{ id, text, cacheId }`. The server SHALL run one LLM invocation per item **in parallel** with a bounded concurrency (and MAY cap total items). The response SHALL return a `results` array with per-item success or error so the client can update caches by `cacheId`. The client grid SHALL prefer this batch endpoint for property auto-summaries and custom batch runs so the browser makes one HTTP request per batch while the server parallelizes provider calls.

#### Scenario: Batch under limit

- **WHEN** the client POSTs a valid batch with `items.length` within the configured maximum
- **THEN** the server SHALL return one result entry per item (success with `response` or failure with `error`) and SHALL reuse the same caching rules as the single-item route when `cacheId` hits the shared cache

#### Scenario: Batch over server limit

- **WHEN** the client POSTs more items than the server maximum
- **THEN** the server SHALL reject the request with HTTP 400

### Requirement: Article cap and cost warning in the grid

To limit token spend, the grid SHALL NOT trigger AI summary batch requests when the number of target articles exceeds a configured maximum (currently 30), aligned between client (`GRID_AI_SUMMARY_MAX_ARTICLES` or equivalent) and server batch `MAX_ITEMS`. Target articles SHALL be defined as: if one or more rows are selected via checkboxes, only those selected hits that appear in the **current filtered result set**; otherwise all hits **currently rendered on the grid** (i.e. the current page when pagination is enabled, or all rendered rows when the view shows a single unpaginated list). When over the limit, the UI SHALL show a visible warning (e.g. `UAlert`) explaining the cap and SHALL disable or skip batch AI actions until the user narrows results, changes page, or selects fewer articles.

#### Scenario: Too many visible results on page, none selected

- **WHEN** the grid’s **current page** shows more than the maximum articles and no checkboxes are selected
- **THEN** the client SHALL NOT call the batch summarize API and SHALL show the cost-limit message

#### Scenario: Too many selected

- **WHEN** the user has selected more than the maximum articles
- **THEN** the client SHALL NOT call the batch summarize API and SHALL show the cost-limit message referencing selection

#### Scenario: Under limit

- **WHEN** the target article count is at or below the maximum and a non-subtitle comparison mode requests summaries
- **THEN** the client MAY call `POST /api/summarizePropertyBatch` with one item per target hit that has non-empty bounded text
