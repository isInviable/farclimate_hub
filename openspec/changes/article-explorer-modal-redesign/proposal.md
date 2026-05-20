## Why

The explorer article experience is being aligned with the FarClimate handoff design: a near-fullscreen blocking article modal with a two-level navigation model, clear information hierarchy (chat / recipe / summary), horizontal "deck" navigation between sub-sections, and decorative backgrounds on text-heavy slides. The current `USlideover` plus single-scroll `UTabs` does not match that model or the map / contacts / references split.

This is a **full replacement** of the current article view: the new layout is the only article UI in the app. `ArticleSidePanel` (explorer) wraps it in a blocking modal; full-page article routes embed the same component without the modal shell. There is no second variant.

## What Changes

- Replace `ArticleSidePanel`'s `USlideover` with a **near-fullscreen blocking `UModal`** (focus trap, dimmed overlay, no interaction with the explorer canvas behind, internal scroll). Modal chrome consists of a **pin** action and a **close (×)** action in the top-right; no other header chrome.
- Replace `ArticleViewAI`'s current `UTabs` with a **two-level navigation model** used by **all** article views (modal and full page):
  - **Primary "rolling menu"** vertical tab list at the top-left with **exactly three** sections: **Chat**, **Recipe**, **Summary**. Canonical order is `[Chat, Recipe, Summary]`. The **active item is always rendered at the bottom** of the rail in a large, bold, near-black heading style; the two inactive items render above it in their canonical relative order, smaller, in the **`primary`** Tailwind UI scale ("trust-blue"). Animations are out of scope for v1; the DOM should not preclude them.
  - **Secondary horizontal submenu** at the top of the content area listing the slides for the active primary section, with prev/next circular arrow controls vertically centered against the slide body, **outside** the content padding (left and right edges of the modal). No swipe / drag / scroll-snap navigation.
- **Remove the fulltext / "full article" tab** from the article UI entirely. `document.fulltext` is no longer rendered inline. Access to the original source is via the **outbound source-URL link** already required by `explorer-article-source-link` and surfaced from the **Summary → Main** slide.
- **Summary** is split into exactly **three** horizontal slides (in this order):
  1. **Main** — hero subtitle/short description, sectors / hazards / type-of-solution / keywords tag groups, and an optional left detail column (Date / Geographic Characterisation / Bio geographical region) when those fields exist; the gallery renders as a **bottom-anchored horizontal image strip** spanning the full slide width; the **outbound source-URL link** lives on this slide.
  2. **Contacts and references** — contact persons, websites, references, with empty states when missing.
  3. **Map** — same map widget and points used today; empty state when there are no points.
- **Recipe** renders **one horizontal slide per non-empty canonical recipe section** (per `explorer-structured-recipe`), reusing the same secondary submenu + arrows pattern. API contracts (`/api/document-recipe`), markdown rules, and key ordering are unchanged.
- **Slide titles** in the body follow the pattern `NN. Section name`, where `NN` is the slide's 1-based index in the active submenu and `Section name` matches the submenu label exactly.
- **Decorative corner backgrounds** apply only to **text-heavy** slides (Contacts & references, Recipe section slides). Slides whose primary content is its own visual (Map, the Main slide's gallery strip) MUST NOT carry decoration. Decorative layers are non-interactive (`pointer-events-none`, `aria-hidden="true"`) and served from `apps/web/public/img/explorer/`.
- **Per-tab slide state** resets to slide 1 whenever the user switches the active primary section.
- **Pin capture** and **article text-selection capture** behavior remains functionally equivalent to the current explorer article path; the new layout MUST wrap slide bodies so the existing pin / selection flows keep working.

## Capabilities

### New Capabilities

- `explorer-article-modal-layout`: Near-fullscreen blocking modal shell for the explorer article view, two-level navigation (rolling-menu primary tabs with active-at-bottom styling + horizontal submenu with prev/next arrows), summary slide set (main with bottom-anchored image strip, contacts/references, map), recipe-as-slides rendering, decorative corner backgrounds limited to text-heavy slides, parity for pin capture and text selection, and replacement of the current `ArticleViewAI` tab layout in **every** caller (modal and non-modal).

### Modified Capabilities

- `article-side-panel-data-alignment`: Clarify that the explorer article surface is now a **blocking modal** that still consumes the canonical `ArticleDetail` shape (uid fetch, optional fields). Presentation rules live in `explorer-article-modal-layout`; data contracts are unchanged.
- `explorer-structured-recipe`: Add a requirement that, in the new article layout, each non-empty canonical recipe section renders as **its own horizontal slide** with the shared submenu + prev/next arrows. Same data, markdown, and ordering rules; no API contract changes.

## Impact

- **Frontend**:
  - `apps/web/app/components/explorer/ArticleSidePanel.vue` — swap `USlideover` for `UModal`, near-fullscreen sizing, pin + close header chrome.
  - `apps/web/app/components/explorer/ArticleViewAI.vue` — replace `UTabs` layout with the new two-level rolling-menu + slide-deck layout; drop the `#full` tab everywhere.
  - `apps/web/app/components/explorer/ArticleSummaryView.vue` — split into three slide bodies (or extract subcomponents) without duplicating data fetching; gallery becomes a horizontal strip.
  - `apps/web/app/components/explorer/ArticleStructuredView.vue` (or wrapper) — render each canonical recipe key as a slide.
  - New shared primitives are likely: a rolling-menu component, a slide-deck wrapper that owns active-slide state and emits prev/next, a decorative-corner background component.
  - Callers that opened the side panel (explorer board, search results, full-page article routes) — no API changes required; behavior changes are encapsulated.
- **Assets**: `apps/web/public/img/explorer/*` for decorative backgrounds; ship layout with safe fallbacks until exports land.
- **i18n**: Existing `tabs.summary` and `tabs.chat` keys reused; add `tabs.recipe` if missing; add per-slide labels (`main`, `contacts_and_references`, `map`) and the source-link label (already covered by `explorer-article-source-link`).
- **Accessibility**: Modal focus management; `aria-current` on the active rolling-menu item; `aria-disabled` on prev/next at deck edges; `aria-live="polite"` for slide-index changes; decorative layers `aria-hidden`. Keyboard arrow-key slide navigation is a nice-to-have (not required for v1).
- **Figma**:
  - [Modal shell — Summary / Main](https://www.figma.com/design/KNlbYcaBvoareidZk5WT3K/FarClimate---Handoff--Copy-?node-id=2578-11081)
  - [Summary / Map slide](https://www.figma.com/design/KNlbYcaBvoareidZk5WT3K/FarClimate---Handoff--Copy-?node-id=2578-11241)
  - [Summary / Contact & references slide](https://www.figma.com/design/KNlbYcaBvoareidZk5WT3K/FarClimate---Handoff--Copy-?node-id=2578-11344)
  - [Recipe slide example](https://www.figma.com/design/KNlbYcaBvoareidZk5WT3K/FarClimate---Handoff--Copy-?node-id=2572-10935)
