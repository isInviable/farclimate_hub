## Why

The explorer article experience is being aligned with the FarClimate handoff design: a focused, blocking article modal with clear information hierarchy (summary vs recipe vs chat), horizontal “deck” navigation between sub-sections, and decorative backgrounds. The current slide-over plus single-scroll tabs do not match that model or the map/contact/references split. Doing this now avoids shipping two competing article UIs and sets up future motion design on the vertical tab rail.

## What Changes

- Replace the explorer **article side panel** (`ArticleSidePanel`) with a **blocking modal** that matches Figma (focus trap, modal overlay, no interaction with the board behind until closed).
- **Primary tabs** (summary, recipe, chat) move to a **vertical tab rail** on the top-left (“rolling menu” visually; animations are out of scope for v1 but the layout should allow them later).
- **Remove the “full article” / original fulltext tab everywhere** — `ArticleViewAI` and any other consumers SHALL only expose summary, structured recipe, and chat.
- **Horizontal “slide” navigation** within summary and recipe: **no swipe/gesture** navigation; users move between slides via a **horizontal submenu** (section labels) and **prev/next arrow** controls.
- **Summary** is split into horizontal slides: **main** (including a **horizontal strip** for gallery images), **contact and references**, **map** — each slide scrolls **vertically** when content overflows.
- **Recipe** (structured JSON sections): **each non-empty canonical section** is its **own slide**, same horizontal nav + vertical scroll per slide; ordering follows existing recipe key order (`explorer-structured-recipe`).
- **Decorative backgrounds** in some slides (corner assets), using Tailwind and static assets under `public/img/explorer` (paths as exported from design).
- **`ArticleViewAI`** remains the **full-screen / non-modal** article view pattern used today (e.g. dedicated article routes); behavior for pins and text selection stays the same as today, only the explorer entry point becomes the new modal shell.

## Capabilities

### New Capabilities

- `explorer-article-modal-layout`: Blocking explorer article modal shell, vertical primary tabs (summary / recipe / chat), horizontal slide decks with explicit nav (submenu + arrows), summary slide set (main with horizontal image strip, contacts/references, map), per-slide vertical scroll, optional decorative corner backgrounds, and parity requirements for pin capture and text selection with the existing explorer article flow.

### Modified Capabilities

- `article-side-panel-data-alignment`: Extend or clarify requirements so the explorer article surface is a **blocking modal** that still consumes the same canonical `ArticleDetail` / resolution rules (uid fetch, optional fields). Presentation changes are detailed in `explorer-article-modal-layout`; data contracts stay aligned with this spec.
- `explorer-structured-recipe`: Add requirements for **one horizontal slide per rendered recipe section** when the recipe is shown inside the explorer article modal (same data rules and markdown rendering; layout/navigation per `explorer-article-modal-layout`).

## Impact

- **Frontend**: `ArticleSidePanel.vue`, likely new child layout components, `ArticleViewAI.vue` (remove full tab globally), `ArticleSummaryView.vue` (split into slides / main image strip for modal context or shared primitives), `ArticleStructuredView.vue` or wrapper for per-section slides in modal, explorer board callers that open the panel.
- **Assets**: `apps/web/public/img/explorer/*` for decorative backgrounds (add or verify when design exports land).
- **Figma**: [Modal shell](https://www.figma.com/design/KNlbYcaBvoareidZk5WT3K/FarClimate---Handoff--Copy-?node-id=2578-11081), [Map slide](https://www.figma.com/design/KNlbYcaBvoareidZk5WT3K/FarClimate---Handoff--Copy-?node-id=2578-11241), [Contact & references](https://www.figma.com/design/KNlbYcaBvoareidZk5WT3K/FarClimate---Handoff--Copy-?node-id=2578-11344).
- **Accessibility**: Modal focus management, visible slide indicators, keyboard support for arrows where applicable.
