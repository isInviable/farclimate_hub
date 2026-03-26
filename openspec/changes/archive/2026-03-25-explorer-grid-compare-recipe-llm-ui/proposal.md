## Why

Explorer grid comparison mode should show a short, comparable blurb per article for each selected “feature,” but `/api/summarizeProperty` is never invoked because search hits do not expose the legacy flat fields (`cost_benefit`, etc.) the grid reads. Comparable text now lives primarily in `recipe_ingredients` (bounded sections). Users also need a way to ask their own comparison question across the same set of articles, and the grid should rely on Nuxt UI instead of ad-hoc controls.

## What Changes

- Map each predefined comparison feature to a **bounded source** (recipe ingredient key and/or `subtitle` / `summary` where appropriate); use that text as **input** to the existing summarize flow, not the full article body.
- Keep **LLM summarization** for predefined features when the bounded section is non-empty: output remains a very short comparison (about one to two sentences) highlighting keywords and key figures, as today’s prompt intends.
- Add a **“Custom compare”** (or similarly labeled) dropdown option that reveals a **text field**; the user’s instruction is sent with each article’s bounded context (e.g. title + subtitle + optional short summary or a fixed recipe bundle—see design) so the model answers the same question for every card.
- Refactor **ViewModeGrid** to use **Nuxt UI** components for controls that are not already standard (e.g. raw `<button>` pagination placeholders, layout polish) while keeping behavior equivalent or improved.
- Optionally tighten the **summarize API** contract (body shape, validation, caching key) so the server accepts explicit `sourceText` and/or `documentId` + `mode` to avoid client-side mistakes and oversized payloads.

## Capabilities

### New Capabilities

- `explorer-viewmode-grid-compare`: Explorer grid comparison UX—feature dropdown (including custom prompt with text input), recipe-aligned source text, loading and cache keys per hit, and Nuxt UI–consistent controls.

### Modified Capabilities

- (none) — Search hits already include `recipe_ingredients` per `search-api`; this change consumes that contract and does not alter the search response shape.

## Impact

- **Frontend**: `apps/web/app/components/explorer/wf/viewmodes/ViewModeGrid.vue` (and related i18n keys).
- **API**: `apps/web/server/api/summarizeProperty.ts` (prompt and request body; optional server-side fetch by `documentId` if adopted in design).
- **Types**: `apps/web/app/types/search.d.ts` or shared types if the summarize request/response is formalized.
- **Dependencies**: Existing Gemini / AI SDK usage; no new npm packages expected unless design chooses a different pattern.
