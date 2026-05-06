# Explorer article modal layout (change spec)

Requirements for the blocking explorer article modal, slide decks, vertical primary tabs, and global article tab set. This file is the delta for the new capability `explorer-article-modal-layout` introduced by change `article-explorer-modal-redesign`.

---

## ADDED Requirements

### Requirement: Explorer article uses a blocking modal shell

The explorer SHALL present the article detail experience in a **blocking modal** when opened from explorer flows that today use `ArticleSidePanel.vue` (or its successor). The modal SHALL trap focus while open, render a visible **modal overlay** behind content, and SHALL NOT allow interaction with the explorer canvas or lists behind it until the user dismisses the modal. The implementation SHALL use Nuxt UI modal primitives (e.g. `UModal`) where they meet accessibility defaults, or document any deviation.

#### Scenario: User dismisses modal

- **WHEN** the user activates the primary close control or the platform-appropriate dismiss action supported by the modal component (e.g. Escape when enabled)
- **THEN** the modal SHALL close, focus SHALL return to a sensible trigger element, and the explorer behind the overlay SHALL become interactive again

### Requirement: Primary navigation is vertical summary, recipe, and chat

The modal body SHALL expose **exactly three** primary sections: **summary**, **structured recipe**, and **chat**, selected via a **vertical tab rail** on the top-left of the modal content area (Figma “rolling menu” placement). Labels SHALL use existing i18n keys where they exist (`tabs.summary`, structured/recipe label, `tabs.chat`) or new keys added for consistency. **Animations on the tab rail are out of scope for the initial implementation** but the DOM structure SHALL not prevent adding motion later.

#### Scenario: User switches primary tab

- **WHEN** the user selects a different primary tab
- **THEN** only the corresponding section content is visible in the main content region and horizontal slide index resets to the first slide for that tab unless the implementation explicitly preserves per-tab slide state (either behavior is acceptable if documented in tasks; default: reset to first slide)

### Requirement: ArticleViewAI exposes only summary, recipe, and chat

The `ArticleViewAI` component SHALL NOT expose a tab, slot, or navigation item for viewing **`document.fulltext`** as markdown in the UI. All usages of `ArticleViewAI` (including full-page article routes) SHALL offer **summary**, **structured recipe**, and **chat** only.

#### Scenario: Full-page article view

- **WHEN** the user opens a full-page article view that embeds `ArticleViewAI`
- **THEN** the UI SHALL show at most the three primary tabs above and SHALL NOT show a “full article” or raw fulltext tab

### Requirement: Summary horizontal slides and content

Within the **summary** primary tab, the modal SHALL provide **horizontal slides** in this order: **main**, **contacts and references**, **map**. Each slide SHALL occupy the full width of the summary content area and SHALL scroll **vertically** when its content exceeds the available height.

The **main** slide SHALL include article fields appropriate to the “hero” summary (e.g. subtitle, external source link as today) and SHALL present gallery images as a **horizontal strip** (single row, horizontally scrollable or wrapping per design) rather than a multi-column grid. Other summary blocks that belong to main per Figma SHALL live on this slide.

The **contacts and references** slide SHALL present contact and reference content that today appears in the summary flow, using empty states when data is missing.

The **map** slide SHALL present the same map visualization and points as the summary map today, with an empty state when there are no map points.

#### Scenario: Map has no points

- **WHEN** the document has no map points for the summary map
- **THEN** the map slide SHALL still be reachable via horizontal navigation and SHALL show a clear empty state without errors

### Requirement: Horizontal slide navigation uses submenu and arrows only

For every horizontal slide deck inside the modal (summary and recipe), the user SHALL navigate between slides using:

1. A **horizontal submenu** listing slide titles (or section names) for the active primary tab, and
2. **Previous** and **next** arrow controls.

The system SHALL **not** rely on touch swipe, drag, or horizontal scroll-snap as the **primary** means of changing slides. Secondary overflow scrolling inside a slide (e.g. image strip) is allowed.

#### Scenario: First slide

- **WHEN** the first slide is active
- **THEN** the “previous” control SHALL be disabled or inert and the subsection menu SHALL still indicate the active slide

### Requirement: Decorative slide backgrounds

Selected slides MAY render **decorative** background imagery in corners as in Figma, using Tailwind layout utilities and files served from `apps/web/public/img/explorer/`. Decorative layers SHALL use `pointer-events-none` and `aria-hidden="true"`. Foreground text SHALL remain readable (use scrims or solid overlays as needed).

#### Scenario: Asset missing

- **WHEN** a referenced decorative asset is not present in `public/img/explorer`
- **THEN** the slide SHALL still render content without broken layout; decoration MAY be omitted

### Requirement: Pin capture and text selection parity

The explorer path that opens the article modal SHALL preserve **human pin capture** and **article text selection capture** behavior equivalent to the pre-change explorer article panel: wrapping components and pin kinds that worked from summary, recipe, and chat SHALL continue to work from the corresponding modal tabs and slides without requiring users to use a different pin flow.

#### Scenario: Pin from summary block

- **WHEN** the user initiates pin capture from a selectable summary block inside the modal
- **THEN** the pin dialog and saved pin SHALL behave the same as before this change relative to document identity and payload shape

### Requirement: ArticleViewAI remains non-modal full layout elsewhere

Routes and views that embed `ArticleViewAI` outside the explorer blocking modal SHALL continue to use a **full-width page layout** (not the modal shell). Only the explorer article entry point SHALL use the blocking modal described here.

#### Scenario: Dedicated article page

- **WHEN** the user navigates to a full-page article route that uses `ArticleViewAI`
- **THEN** the article UI SHALL not be wrapped in the explorer blocking modal component
