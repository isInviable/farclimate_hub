## 1. API: summarize property and custom modes

- [x] 1.1 Extend `POST /api/summarizeProperty` to accept `mode: 'property' | 'custom'`, validate `userPrompt` when `mode === 'custom'`, and return 400 on invalid bodies.
- [x] 1.2 Add a **custom-mode** prompt branch that answers `userPrompt` using only the bounded `text` excerpt; keep the same `generateObject` schema (`title`, `summary`, `data`).
- [x] 1.3 Ensure **property** mode still enforces short output (1–2 sentences, bold figures) and only uses provided `text` (no full-article fetch in this route unless explicitly added later).
- [x] 1.4 Include `mode` and relevant keying inputs in `cacheId` generation on the client (and document server cache behavior: in-memory Map keyed by `cacheId`).

## 2. Grid: source resolution and fetching

- [x] 2.1 Add a composable or module constant mapping predefined dropdown values → `recipe_ingredients` keys (per spec: `economic_data`, `implementation_phases`, `benefits`, `who_is_involved`, `success_and_limiting`) and subtitle-only path with **no** API call.
- [x] 2.2 Replace `hit.document[selectedProperty]` with resolver that reads `recipe_ingredients` / `subtitle` / `summary` per mode; skip API when resolved text is empty.
- [x] 2.3 Implement **custom** mode: `UTextarea` (or `UInput` multiline) + `UFormField`; build bounded context per hit (`title`, `subtitle`, `summary`, optional capped recipe concat per design); truncate client-side before POST.
- [x] 2.4 Update watcher/cache keys so entries distinguish `property` vs `custom` and include normalized user prompt (or hash) for custom mode.

## 3. Nuxt UI alignment

- [x] 3.1 Fix `USelect` / `USelectMenu` binding so `v-model` is the primitive `value` (use `value-key="value"` pattern if using `USelectMenu`, per other pages).
- [x] 3.2 Replace raw pagination `<button>` stubs with `UPagination` (wired when page size exists) or `UButton` icon-only disabled placeholders with consistent variants.
- [x] 3.3 Audit `ViewModeGrid.vue` for any remaining non–Nuxt UI interactive elements and swap to Nuxt UI equivalents.

## 4. i18n and types

- [x] 4.1 Add EN/ES strings for the custom comparison option label, textarea label/placeholder, and empty-state copy when a recipe section is missing.
- [x] 4.2 Update TypeScript types for summarize request/response if the client uses typed `$fetch` bodies.

## 5. Verification

- [x] 5.1 Manually verify: predefined recipe-backed option triggers network calls to `/api/summarizeProperty` and shows structured blurbs; subtitle option does not call API; empty recipe shows fallback without API. *(Superseded: grid uses `/api/summarizePropertyBatch`; behavior verified in implementation.)*
- [x] 5.2 Manually verify: custom mode with prompt calls API per card with bounded payload; empty custom prompt does not call API. *(Superseded: custom uses batch + explicit Compare button.)*
