## Why

The explorer “Structured” tab (`ArticleStructuredView.vue`) still calls `POST /api/structureArticle`, which restructures case-study text with Gemini on every view. Pipeline work now persists a canonical **recipe** (`knowledge.recipe.ingredients` per `document_id` + `lang`) that matches the product sections. Serving the structured view from the database removes redundant AI cost/latency, improves consistency with ingested data, and aligns the UI with the same field model as the pipeline.

## What Changes

- Expose recipe JSON for documents returned by the same path the explorer already uses (`get_documents_by_ids` / `get_all_documents`), e.g. a nullable `recipe_ingredients` (JSONB object) column on those RPC results, joined from `knowledge.recipe` on `(document_id, filter_lang)`.
- Update the Nuxt `search` server route (and any TypeScript document types) to pass through `recipe_ingredients` on each hit’s `document`.
- Refactor `ArticleStructuredView.vue` to **stop** calling `/api/structureArticle`; render sections from `recipe_ingredients` keys in a fixed order, with **MarkdownIt** for each section body (markdown strings from the DB). Hide sections that are empty after trim.
- Remove or retire `server/api/structureArticle.ts` and its in-memory cache if nothing else references it (**BREAKING** for any external client that called that endpoint).
- Optional i18n: user-visible section labels via locale keys; `language` prop continues to select which `recipe` row applies (aligned with `filter_lang`).
- **UI audit**: While refactoring the structured article view (and its immediate explorer parent wiring), review for **legacy/custom markup** (raw buttons, ad hoc spinners, hand-rolled “card” divs, non–Nuxt UI feedback patterns) and **replace with Nuxt UI equivalents** where a suitable component exists (`UButton`, `UCard`, `UAlert`, `UIcon`, loading/empty patterns per Nuxt UI docs), matching project component standards.

## Capabilities

### New Capabilities

- `explorer-structured-recipe`: Structured tab renders pipeline recipe fields from DB-backed document payload, with markdown rendering, stable section ordering, and Nuxt UI–first markup on touched explorer components (no unnecessary legacy UI patterns).

### Modified Capabilities

- `search-api`: Search/load-all responses SHALL include optional `recipe_ingredients` on `document` when the RPC provides it; requirement text for response/document shape updated accordingly.
- `consolidated-knowledge-schema`: Public SQL wrappers `get_documents_by_ids` and `get_all_documents` SHALL return an additional nullable column for recipe ingredients (JSONB), with `LEFT JOIN` to `knowledge.recipe` matching `filter_lang`.

## Impact

- **Database**: `packages/db/sql/06_public_api.sql` — extend two function signatures and `SELECT` lists (and matching `knowledge` definitions if split across files; today bodies live in `06_public_api.sql`).
- **Backend**: `apps/web/server/api/search.ts` — map new RPC field into `document`.
- **Types**: `apps/web/app/types/search.d.ts` (and `index.ts` if shared `SearchDocument` lives there).
- **UI**: `ArticleStructuredView.vue`, `ArticleViewAI.vue` (pass `recipe_ingredients` or full `document` only); align icons, loading, empty states, and actions with **Nuxt UI** during the same pass.
- **Removal**: `apps/web/server/api/structureArticle.ts`.
- **Dependencies**: No new npm packages if MarkdownIt usage stays as today.
