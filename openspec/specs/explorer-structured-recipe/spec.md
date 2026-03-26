# Explorer structured recipe view

Structured tab renders pipeline recipe sections from the database with markdown.

---

## ADDED Requirements

### Requirement: Structured tab uses database recipe only

The explorer structured view (`ArticleStructuredView` or successor) SHALL NOT call `/api/structureArticle` or any other LLM endpoint to build the recipe. It SHALL render section content from a `recipe_ingredients` object (string keys to markdown strings) resolved as follows:

- The parent MAY pass optional `recipe_ingredients` from the search or document payload (e.g. `hit.document.recipe_ingredients` when `get_documents_by_ids` returns it).
- The view SHALL require a stable **`document_id`** (UUID, `knowledge.documents.id`) so recipe data can be loaded when props omit it or the RPC on the project does not yet expose `recipe_ingredients` in search results.
- When props contain no renderable recipe (null, undefined, or only empty / whitespace string values), the view SHALL load via **`GET /api/document-recipe`** with `documentId` and `lang` query parameters. That route SHALL use `get_documents_by_ids` and MAY fall back to reading `knowledge.recipe` when the RPC row lacks `recipe_ingredients`; it SHALL NOT use an LLM.

#### Scenario: Recipe present from props

- **WHEN** `recipe_ingredients` is an object with at least one non-empty string value for a canonical key

- **THEN** the UI SHALL show one block per non-empty section in the agreed order without calling `/api/document-recipe`, each title from i18n (or fallback English label), body rendered as markdown via MarkdownIt

#### Scenario: Recipe loaded by document id

- **WHEN** props lack a renderable `recipe_ingredients` but `document_id` is set and the database has a recipe for that document and language

- **THEN** the UI SHALL fetch `/api/document-recipe` and render sections from the returned `recipe_ingredients`; on failure it SHALL show an error state with retry and SHALL NOT invoke an LLM

#### Scenario: Recipe missing or empty after load

- **WHEN** `recipe_ingredients` is null, undefined, or an object with only empty strings, and `/api/document-recipe` returns null or empty ingredients

- **THEN** the UI SHALL show a clear empty state and SHALL NOT invoke an LLM

### Requirement: Section ordering and visibility

Sections SHALL be iterated in this fixed key order: `context_summary`, `challenges`, `policy_context`, `legal_aspects`, `who_is_involved`, `economic_data`, `objectives`, `solutions_implemented`, `implementation_phases`, `success_and_limiting`, `benefits`, `lessons_learnt`, `transferability`. Any key whose value is missing or whitespace-only after trim SHALL be omitted from the table of contents and from the body.

#### Scenario: Sparse recipe

- **WHEN** only `context_summary` and `benefits` are non-empty

- **THEN** only those two sections appear in the TOC and main column

### Requirement: Markdown rendering

Each rendered section body SHALL be passed through MarkdownIt with `html`, `linkify`, and `typographer` enabled, consistent with the explorer full-text tab pattern, and displayed inside a prose-oriented container.

#### Scenario: Markdown in a section

- **WHEN** a section value contains markdown lists and emphasis

- **THEN** the output HTML reflects standard markdown rendering for that content

### Requirement: Nuxt UI layout

Section blocks SHALL use Nuxt UI primitives (e.g. `UCard`) for visual consistency with the explorer; icons MAY be shown per section using `UIcon` / Iconify identifiers aligned with the previous structured view where applicable.

#### Scenario: Default structured layout

- **WHEN** the structured tab is displayed on desktop

- **THEN** each visible section appears as a distinct card (or equivalent Nuxt UI container) with heading and markdown body

### Requirement: Replace legacy UI with Nuxt UI on touched files

For `ArticleStructuredView.vue` and explorer files modified to pass recipe data (at minimum `ArticleViewAI.vue`), the implementation SHALL replace legacy or ad hoc UI patterns with **Nuxt UI** components when an equivalent exists (e.g. `UButton` instead of raw `<button>` for actions, `UAlert` for empty/error messaging, `UIcon` for section icons, Nuxt UI–appropriate loading/empty states instead of custom spinner-only markup alone). Where no suitable Nuxt UI component exists, minimal Tailwind markup MAY remain.

#### Scenario: Interactive controls

- **WHEN** the structured view renders a button or other primary action control

- **THEN** it SHALL use `UButton` (or another Nuxt UI control), not a raw `<button>` with only utility classes

#### Scenario: Empty recipe state

- **WHEN** no recipe content is available

- **THEN** the message SHALL use `UAlert` or another explicit Nuxt UI feedback component, not only unlabeled gray text in a bare `<div>`
