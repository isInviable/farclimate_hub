# Tasks

## 1. Order, copy, and chapter builder

- [x] 1.1 Reorder `RECIPE_SECTION_KEYS` in `apps/web/app/composables/useArticleRecipe.ts` to the design order, and set the same array in `apps/web/app/components/explorer/ArticleStructuredView.vue`. Verify the two arrays are identical and match `context_summary`, `policy_context`, `legal_aspects`, `challenges`, `objectives`, `who_is_involved`, `implementation_phases`, `economic_data`, `solutions_implemented`, `benefits`, `lessons_learnt`, `success_and_limiting`, `transferability`.
- [x] 1.2 Update `recipe.nav` and `recipe.sections` in `apps/web/i18n/locales/es.json`, `en.json`, and `it.json` to the design copy table, including chapter keys and replacing the `summaryPlus` strings with Resumen, Summary, and Sintesi. Verify none of the three files still contains `Resumen+`, `Summary+`, or `Sintesi+`, and that Spanish `context_summary` is `Breve contexto` and `policy_context` is `Políticas públicas`.
- [x] 1.3 Add a pure chapter builder next to the recipe composable. It takes the flat segment list and returns Introducción (always Resumen then Ubicación), then only the canonical chapters that have visible sections, with each item's flat index and `/img/adaptarium/receta/` image from the design table. Add `apps/web/tests/explorer/recipeChapters.test.ts` covering a full recipe, a recipe where only `context_summary` and `benefits` are present (Cómo se hizo omitted, Ubicación still second), and the public-policies filename `12-icono-politicas-politicas.png`. Verify with `pnpm test tests/explorer/recipeChapters.test.ts` from `apps/web`.

## 2. Sidebar and article order

- [x] 2.1 Change `ArticleSectionNav` to render chapter headings as text, not buttons, and rows as buttons with a decorative sea-glass image, wrapping label, and no item number. Active row stays semibold in the current neutral colors. Give the recipe aside `min-h-0` and `overflow-y-auto`. Verify a heading element is not a `button`, each row's `img` has an empty alt, and the aside scrolls independently of `.recipe-scroll-stack`.
- [x] 2.2 In `ArticleViewAI`, build segments as Resumen, Ubicación, then `visibleSections`, pass the builder output to the nav, and move the map section to directly after the summary section with `mapSegmentIndex` of `1`. Keep `segmentNumber` on article headings. Do not render chapter titles or the sea-glass images in the scroll column, and do not revive `RECIPE_SECTION_IMAGES`. Verify the second `[data-recipe-segment-index]` in `.recipe-scroll-stack` is the map, the scroll column contains no chapter title, and `pnpm test tests/explorer/recipeChapters.test.ts` from `apps/web` still passes.

## 3. Integration

- [x] 3.1 In the browser, open a case study whose recipe has every section and confirm the sidebar chapters and row order match the poster, Ubicación sits under Resumen in the article, clicking Transferibilidad scrolls there, and scrolling the article moves the sidebar mark without scrolling the sidebar itself. Then open a sparse recipe, or simulate one, and confirm an empty chapter title is gone while Resumen and Ubicación remain.
