## Why

The structured recipe is the primary analytical artifact for a case study, but in the article modal it sits behind a deep navigation path (separate primary rail from summary, slide-based recipe), so users need too many clicks to reach it. Elevating **Recipe** to a top-level primary destination and folding summary-style entry into the recipe flow makes the core content discoverable while keeping chat and contacts one click away.

## What Changes

- Replace the current primary/secondary pattern where **Summary** competes with **Recipe** at the top level with a flatter top-level menu: **Recipe**, **Chat**, **Contacts**.
- **Recipe** becomes the only primary area with a submenu: first item **Summary+** (the existing summary experience as the opening segment of recipe), followed by every non-empty canonical recipe section in order, with **map** as the last segment of the recipe flow (aligned with “summary first, map last” within the unified recipe story).
- Remove slide-deck navigation for recipe content: all recipe segments (summary blocks, markdown sections, map) live in **one vertically scrollable column** with in-panel anchors or a TOC, not paged slides.
- Introduce a **two-column layout** for the recipe area: a **fixed-width left column** and a fluid right column. For the summary segment, the left column keeps **title, date, and existing summary metadata** as today. For other recipe segments, the left column may show **decorative imagery** (or a reserved decorative zone) instead of duplicating metadata.
- **Chat** and **Contacts** remain top-level panels without submenus (contacts correspond to today’s summary contacts slide content, lifted to parity with chat).
- Implementation is expected to center on the article modal body (`ArticleViewAI.vue` and related article components slotted from `ArticleSidePanel.vue`); i18n keys and any deep links to “tabs” may need updates.

## Capabilities

### New Capabilities

- `explorer-article-modal-navigation`: Information architecture, layout, and interaction requirements for the article modal/side panel: top-level sections (Recipe, Chat, Contacts), recipe-only submenu (Summary+ through map), fixed left column + scrollable recipe stack, and removal of slide-based paging for recipe viewing in this context.

### Modified Capabilities

- _(none)_ — Existing `explorer-structured-recipe` and `article-side-panel-data-alignment` specs govern data sourcing and document typing; this change is navigation and presentation inside the article shell, captured by the new capability above.

## Impact

- **Frontend**: `apps/web/app/components/explorer/ArticleViewAI.vue` (primary rail items, secondary nav, summary vs recipe layout, `SlideDeck` usage for recipe), related components under `apps/web/app/components/explorer/article/` (`RollingMenuRail`, `ArticleSecondarySlideNav`, `SlideDeck`, summary slides), and possibly `ArticleSidePanel.vue` only if chrome or slots must move.
- **i18n**: New or renamed labels for primary items and recipe submenu (Summary+, section titles, Contacts).
- **Accessibility**: Update `role="tabpanel"` / labeling if the control model shifts from tabs to a different pattern; preserve keyboard focus and skip targets for long scroll.
- **Tests**: Any Playwright or component tests that assert tab order, slide indices, or selectors tied to old structure.
