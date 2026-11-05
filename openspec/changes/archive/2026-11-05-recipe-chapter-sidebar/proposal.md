# Proposal

## Why

The article recipe sidebar is a flat numbered list in pipeline key order, with the map last. Readers need the same sections grouped into the four chapters of the recipe poster, in that chapter order, with each row identified by its sea-glass image.

## What Changes

- Group the recipe sidebar into Introducción, Situación de partida, Cómo se hizo, and Qué se logró. Chapter titles appear only in the sidebar, not in the scrolling article.
- Reorder the scrolling article to match those chapters. Resumen stays first, Ubicación moves from the end to sit directly under Resumen, and the canonical recipe sections follow in chapter order.
- Replace the sidebar's per-item numbers with the sea-glass images already in `public/img/adaptarium/receta`. Keep neutral label color. Do not repeat those images in the article body.
- Rename the visible section and chapter labels to the poster vocabulary in Spanish, English, and Italian. "Resumen+" / "Summary+" / "Sintesi+" becomes Resumen / Summary / Sintesi.
- Omit a chapter when none of its recipe sections have text. Resumen and Ubicación always remain. Let the sidebar scroll on its own when the list is taller than the column.
- **BREAKING** for readers of the article: section order and several labels change. Recipe keys, stored markdown, and the recipe API do not change.

## Capabilities

### New Capabilities

- `explorer-recipe-chapter-nav`: Chapter grouping, sea-glass rows, poster labels, and scroll order of the article recipe, including Resumen and Ubicación. Chapter titles stay out of the scrolling column.

### Modified Capabilities

- `explorer-structured-recipe`: The fixed canonical key order used for the table of contents and the body changes to the chapter order. Empty sections stay omitted.

## Impact

- `apps/web/app/components/explorer/ArticleViewAI.vue` (segment order and nav data; page and modal chrome share this layout).
- `apps/web/app/components/explorer/article/ArticleSectionNav.vue` (groups, images, independent scroll).
- `apps/web/app/composables/useArticleRecipe.ts` (`RECIPE_SECTION_KEYS` order).
- `apps/web/app/components/explorer/ArticleStructuredView.vue` keeps a duplicate key list and is not mounted; update that list so it cannot drift.
- `apps/web/i18n/locales/es.json`, `en.json`, and `it.json`.
- Existing images under `apps/web/public/img/adaptarium/receta/`. No new assets, no API or database change.
- Supersedes the submenu order in the unarchived change `article-side-panel-recipe-navigation` (Summary+, then canonical sections, then Map last). That order is not in the main specs.
