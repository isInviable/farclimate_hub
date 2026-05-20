# Explorer article modal layout (change spec)

Requirements for the near-fullscreen blocking explorer article modal, the rolling-menu primary tabs, the horizontal slide decks, and the unified article view layout shared between the explorer modal and full-page article routes. This file is the delta for the new capability `explorer-article-modal-layout` introduced by change `article-explorer-modal-redesign`.

---

## ADDED Requirements

### Requirement: Explorer article uses a near-fullscreen blocking modal shell

The explorer SHALL present the article detail experience in a **near-fullscreen blocking modal** when opened from any explorer flow that today uses `ArticleSidePanel.vue` (or its successor). The modal SHALL trap focus while open, render a visible dimmed overlay, scroll **internally** when its content overflows the viewport, and SHALL NOT allow interaction with the explorer canvas, lists, or map behind it until the user dismisses the modal. The implementation SHALL use Nuxt UI modal primitives (e.g. `UModal`) where they meet accessibility defaults, or document any deviation.

The modal header chrome SHALL consist of exactly two icon controls anchored to the top-right of the modal: a **pin** action and a **close (×)** action. No additional header chrome (no document title row, no in-modal "open original" button) SHALL be added — the outbound source-URL link required by `explorer-article-source-link` lives inside the body on the Summary → Main slide.

#### Scenario: User dismisses modal

- **WHEN** the user activates the close (×) control or the platform-appropriate dismiss action supported by the modal component (e.g. Escape when enabled)
- **THEN** the modal SHALL close, focus SHALL return to a sensible trigger element, and the explorer behind the overlay SHALL become interactive again

#### Scenario: Content longer than the viewport

- **WHEN** the active slide's content is taller than the modal's available height
- **THEN** the modal body (or the slide container within it) SHALL scroll internally and the page behind the modal SHALL NOT scroll

### Requirement: Article view replaces the previous tab layout in every caller

The article view component (`ArticleViewAI` or its replacement) SHALL render exclusively with the two-level navigation defined in this spec — a primary "rolling menu" of three sections (Chat, Recipe, Summary) plus a secondary horizontal slide submenu. The previous `UTabs`-based four-tab layout (summary / recipe / fulltext / chat) SHALL be removed.

The same article view component SHALL be used by the explorer blocking modal AND by full-page article routes; the only difference between contexts SHALL be the absence of the modal shell on full-page routes. There SHALL NOT be a parallel "non-modal" article layout.

The article view SHALL NOT expose a tab, slide, or navigation item for rendering `document.fulltext` inline. Access to the original article SHALL be via the outbound `source_url` link required by `explorer-article-source-link`, surfaced from the Summary → Main slide.

#### Scenario: Full-page article route

- **WHEN** the user navigates to a full-page article route that embeds the article view component
- **THEN** the article SHALL render with the rolling menu + slide deck (no `UTabs`), without the explorer blocking-modal shell, and SHALL NOT expose a fulltext tab or slide

#### Scenario: No fulltext UI anywhere

- **WHEN** any caller mounts the article view component
- **THEN** the rendered output SHALL NOT contain a "full article" / "original" / fulltext tab or slide and SHALL NOT inline-render `document.fulltext` as Markdown

### Requirement: Primary navigation is a rolling-menu vertical rail

The article view SHALL expose **exactly three** primary sections: **Chat**, **Recipe**, **Summary**, presented as a vertical "rolling menu" anchored to the top-left of the body content area. The canonical order SHALL be `[Chat, Recipe, Summary]`.

The **active item SHALL always be rendered at the bottom** of the rail in a large, near-black, heading-weight style. The two **inactive items** SHALL render above the active item, retaining their canonical relative order (i.e. when Recipe is active the rail reads top→bottom: Chat, Summary, Recipe; when Chat is active: Recipe, Summary, Chat). Inactive labels SHALL use the **`primary` Tailwind UI scale** ("trust-blue") at the smaller, link-style weight; the active label SHALL use the project's near-black foreground token at heading weight.

The rail SHALL expose tablist ARIA semantics (`role="tablist"` with `role="tab"` items, `aria-selected`, `aria-controls`). Animations are out of scope for v1; the DOM SHALL not preclude adding motion later.

Labels SHALL come from the application i18n system: existing `tabs.summary` and `tabs.chat` keys SHALL be reused; a `tabs.recipe` key SHALL be added if not already present.

#### Scenario: Active item is at the bottom

- **WHEN** the article view renders with any of Chat, Recipe, or Summary as the active primary section
- **THEN** that section's label SHALL be the bottom-most item in the rolling menu, rendered in the active style, and the other two SHALL render above it in canonical relative order in the inactive `primary`-scale style

#### Scenario: User switches primary section

- **WHEN** the user activates a different primary section
- **THEN** only the corresponding section content SHALL be visible in the main content region, the slide deck for that section SHALL reset to its first slide, and the rolling menu SHALL re-render with the newly active item at the bottom

### Requirement: Secondary slide deck uses submenu and prev/next arrows only

For every horizontal slide deck inside the article view (Summary and Recipe), the user SHALL navigate between slides using:

1. A horizontal **submenu** at the top of the slide content area listing slide labels for the active primary section, with the active label styled in near-black/bold and inactive labels in the `primary` scale, and
2. **Previous** and **next** circular icon buttons positioned outside the slide content padding at the left and right edges of the modal body, vertically centered against the slide.

The system SHALL NOT rely on touch swipe, drag, or horizontal scroll-snap as the **primary** means of changing slides. Vertical scrolling **inside** a slide and horizontal scrolling within secondary widgets (e.g. the Main slide gallery strip) are allowed.

#### Scenario: First and last slide

- **WHEN** the first slide is active
- **THEN** the previous arrow SHALL be visually disabled and SHALL not change the slide if activated; the submenu SHALL still indicate the active slide
- **WHEN** the last slide is active
- **THEN** the next arrow SHALL be visually disabled and SHALL not change the slide if activated

#### Scenario: Submenu jump

- **WHEN** the user activates a non-active label in the submenu
- **THEN** the deck SHALL switch directly to that slide without traversing intermediate slides

### Requirement: Slide title pattern in the body

Each slide body SHALL open with a heading in the form `NN. Section name`, where:

- `NN` is the **1-based index** of the slide in the active submenu, rendered in a muted/grey numeric style (per Figma); and
- `Section name` is **the same string** used for that slide in the submenu.

The implementation SHALL derive the heading text and the submenu label from a single source so the two SHALL NOT drift.

#### Scenario: Numbering reflects submenu order

- **WHEN** the user views the second slide in the active primary section's submenu
- **THEN** the slide body heading SHALL begin with `02.` followed by the same label shown in the submenu for that slide

### Requirement: Summary slide composition

Within the Summary primary section, the article view SHALL render exactly **three** horizontal slides in this order:

1. **Main** — SHALL include the article's hero subtitle / short description; an optional **left detail column** showing Date, Geographic Characterisation, and Bio geographical region rendered only when the corresponding `ArticleDetail` fields are non-empty; the sectors / hazards / type-of-solution / keywords tag groups; and the outbound source-URL link mandated by `explorer-article-source-link`. The article gallery SHALL render as a **single bottom-anchored horizontal strip** spanning the full slide width, scrolling horizontally on overflow. A multi-column gallery grid SHALL NOT be used in this layout.

2. **Contacts and references** — SHALL present contact persons, websites, and references derived from the canonical `ArticleDetail`, with empty states when those fields are missing.

3. **Map** — SHALL present the same map widget and points used today by the summary map, with an empty state when the document has no map points.

Each slide SHALL occupy the full width of the slide content area and SHALL scroll **vertically** when its content exceeds the available height. The optional left detail column on the Main slide is **per-slide**, not a persistent rail across the deck; it SHALL NOT appear on the Contacts and references or Map slides.

#### Scenario: Map has no points

- **WHEN** the document has no map points for the summary map
- **THEN** the Map slide SHALL still be reachable via submenu and arrows, and SHALL show a clear empty state without errors

#### Scenario: No contacts, websites, or references

- **WHEN** the document has none of contact persons, websites, or references
- **THEN** the Contacts and references slide SHALL still be reachable and SHALL show a clear empty state without errors

#### Scenario: Sparse Main metadata

- **WHEN** the document has no Date, Geographic Characterisation, or Bio geographical region values
- **THEN** the Main slide SHALL render without the optional left detail column, with no broken layout

### Requirement: Recipe renders as one slide per non-empty canonical section

Within the Recipe primary section, the article view SHALL render **one horizontal slide per non-empty canonical recipe section** as defined by `explorer-structured-recipe`. Slide ordering SHALL follow the canonical key order from that capability. Submenu labels SHALL match the canonical section names. Markdown rendering, the underlying `/api/document-recipe` fetch behavior, and key ordering SHALL be unchanged by this layout.

When the structured recipe has zero non-empty sections, the Recipe primary section SHALL show a single empty-state placeholder reachable as a degenerate one-slide deck.

#### Scenario: Recipe section ordering

- **WHEN** the user opens the Recipe primary section
- **THEN** the submenu SHALL list the non-empty canonical recipe sections in the order defined by `explorer-structured-recipe` and the body of each slide SHALL render that section's Markdown content using the existing rendering rules

### Requirement: Decorative backgrounds limited to text-heavy slides

Decorative corner imagery (e.g. compass, wax-seal/papers illustrations) MAY render on text-heavy slides — specifically the Summary → Contacts and references slide and the Recipe section slides. Decorative imagery SHALL NOT render on slides whose primary content is its own visual: the Summary → Main slide (which carries the gallery strip) and the Summary → Map slide.

Decorative layers SHALL be served from `apps/web/public/img/explorer/`, SHALL use `pointer-events-none` and `aria-hidden="true"`, and SHALL be positioned so foreground text remains readable (with scrim/overlay where needed). When a referenced asset is missing the slide SHALL still render content without broken layout; decoration MAY be omitted.

#### Scenario: Decoration on text-heavy slide

- **WHEN** the user views the Summary → Contacts and references slide or any Recipe section slide and the corresponding decorative asset is present
- **THEN** the decorative imagery SHALL render in its specified corner without intercepting pointer events and SHALL be hidden from assistive tech

#### Scenario: Decoration suppressed on visual slides

- **WHEN** the user views the Summary → Main slide or the Summary → Map slide
- **THEN** no decorative corner imagery SHALL render

### Requirement: Per-tab slide state resets on primary section switch

When the user switches the active primary section, the secondary slide index for the newly active section SHALL reset to slide 1. Within a single primary section, while the modal stays open, the secondary slide index SHALL be preserved across other interactions (e.g. switching back to a previously visited primary section restarts that section at slide 1, not at the previously visited slide).

#### Scenario: Re-entering a primary section

- **WHEN** the user opens Recipe, navigates to slide 3, switches to Summary, then switches back to Recipe
- **THEN** Recipe SHALL re-open on slide 1

### Requirement: Pin capture and text selection parity

The new article view SHALL preserve **human pin capture** and **article text selection capture** behavior equivalent to the pre-change explorer article panel: wrapping components and pin kinds that worked from the prior summary, recipe, and chat tabs SHALL continue to work from the corresponding slides and primary sections in the new layout, without requiring users to use a different pin flow.

#### Scenario: Pin from a Summary slide block

- **WHEN** the user initiates pin capture from a selectable block on any Summary slide
- **THEN** the pin dialog and saved pin SHALL behave the same as before this change relative to document identity and payload shape

#### Scenario: Pin from a Recipe slide

- **WHEN** the user initiates pin capture from selectable text on a Recipe section slide
- **THEN** the pin dialog and saved pin SHALL behave the same as before this change

### Requirement: Color tokens for primary and secondary navigation

Inactive primary-tab labels and inactive submenu labels SHALL be styled using the **`primary`** Tailwind UI scale ("trust-blue") configured in `apps/web/app/app.config.ts`. Active primary-tab and active submenu labels SHALL use the project's near-black foreground token at the appropriate heading or body-bold weight per Figma. Component code SHALL NOT introduce raw hex colors for these states.

#### Scenario: Inactive label color

- **WHEN** any inactive primary-tab or submenu label is rendered
- **THEN** its text color SHALL be derived from the `primary` Tailwind UI scale and SHALL NOT be a hard-coded hex
