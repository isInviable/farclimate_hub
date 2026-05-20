# Explorer structured recipe view (change delta)

Delta for capability `explorer-structured-recipe` under change `article-explorer-modal-redesign`.

---

## ADDED Requirements

### Requirement: Structured recipe renders one canonical section per horizontal slide

When structured recipe content is rendered inside the article view component (capability `explorer-article-modal-layout`) — whether the article view is wrapped in the explorer blocking modal or rendered on a full-page article route — the UI SHALL present **each visible canonical recipe section** (non-empty after trim, in the fixed key order defined in **Section ordering and visibility**) as **exactly one horizontal slide**. Submenu labels SHALL correspond to those section titles.

The UI SHALL provide explicit navigation via the submenu and the previous/next arrow controls defined in `explorer-article-modal-layout`; swipe, drag, and horizontal scroll-snap SHALL NOT be required to change slides. Each slide's markdown body SHALL appear inside a vertically scrollable region when content overflows the available height.

Markdown rendering, data loading (`/api/document-recipe` rules), canonical key ordering, and omission of empty keys SHALL remain as specified in the baseline **Structured tab uses database recipe only** and **Section ordering and visibility** requirements.

The previous stacked-card / `UCard` per section layout SHALL NOT be used by the article view component. The baseline requirement **Nuxt UI layout** is interpreted in the new layout as: each slide body uses Nuxt UI primitives where appropriate (e.g. `UAlert` for empty/error states, `UIcon` for section icons), but the per-section vertical card stack is replaced by the slide deck.

#### Scenario: Multiple non-empty sections in the article view

- **WHEN** three canonical keys have non-empty bodies and the user opens the Recipe primary section in the article view
- **THEN** the secondary submenu SHALL expose three entries in the canonical order and the user SHALL be able to move among three slides using the prev/next arrows or by activating a submenu label, without using swipe or drag

#### Scenario: Recipe on a full-page article route

- **WHEN** the user views structured recipe in the article view outside the explorer blocking modal (e.g. on a full-page article route)
- **THEN** the recipe SHALL render with the same one-section-per-slide horizontal deck layout as inside the modal; a stacked card layout SHALL NOT be used

#### Scenario: Recipe with zero non-empty sections

- **WHEN** the structured recipe has zero non-empty canonical sections after trim
- **THEN** the Recipe primary section SHALL render a single empty-state slide reachable as a degenerate one-slide deck, using Nuxt UI feedback primitives (e.g. `UAlert`)
