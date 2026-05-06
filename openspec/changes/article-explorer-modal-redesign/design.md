## Context

Today the explorer opens documents in `ArticleSidePanel.vue`, a **non-modal `USlideover`** that embeds **`ArticleViewAI`**, which uses **`UTabs`** for summary, structured recipe, full markdown article, and chat. Summary content is largely one vertical column (`ArticleSummaryView`), including a **grid** of gallery images. Figma handoff defines a **blocking modal**, **vertical primary tabs** (summary / recipe / chat), and **horizontal decks** of slides with **explicit navigation** (submenu + arrows), plus **decorative corner backgrounds** on selected slides. Product decision: **remove the fulltext tab globally**; **`ArticleViewAI`** remains the shared full-screen article experience (not a modal) with the same pin and text-selection behavior as today.

## Goals / Non-Goals

**Goals:**

- Ship a **blocking modal** for explorer article inspection that matches the handoff structure and is keyboard- and screen-reader-friendly within Nuxt UI constraints.
- Implement **vertical primary tabs** and, within summary and recipe, **horizontal slide stacks** with **top horizontal submenu** + **previous/next arrows** (no swipe or drag-to-change-slide).
- Split **summary** into slides: **main** (horizontal image strip + existing main content that belongs on slide 1), **contacts and references**, **map** — each with **independent vertical scrolling**.
- Render **recipe** as **one canonical JSON section per slide**, preserving existing data sourcing, ordering, and Markdown rules from `explorer-structured-recipe`.
- Keep **`ArticleTextSelectionCapture`** and pin flows **functionally equivalent** to the current explorer article path (wrapping boundaries may shift but behavior must not regress).
- Use **Tailwind** for layout; use **static assets** under `public/img/explorer` for decorative backgrounds where design specifies.

**Non-Goals:**

- **Animation** on the vertical tab rail or slide transitions (v1); layout should **reserve space** and avoid markup that blocks adding motion later.
- Changing **recipe JSON schema**, **chat API**, or **document fetch** contracts beyond what existing specs already require.
- Replacing **`ArticleViewAI`** on full-page routes with a modal (full page stays **non-modal**).

## Decisions

1. **Shell component: `UModal` (or Nuxt UI modal primitive) instead of `USlideover`** for the explorer article entry point, with `modal: true` (blocking), focus trap, and overlay click to dismiss only if design allows — default blocking pattern per Figma.

2. **Two-level navigation model:**
   - **Primary:** vertical tab list (Nuxt UI where possible, e.g. vertical `UTabs` orientation or `UNavigationTree`-like list — pick the primitive that best matches Figma and accessibility).
   - **Secondary:** horizontal **segmented control / link row** for slide titles within the active primary tab, plus **icon buttons** for previous and next slide; **disabled state** at first/last slide; optional **slide index** label for clarity.

3. **Slide content without gestures:** implement horizontal switching with **controlled active slide index** (Vue `ref`) and **CSS translate** or **`scrollTo`** on a single row of panels — prefer **translate + overflow-hidden** to avoid accidental horizontal scroll on trackpads being interpreted as “gesture navigation” (product asked for no gestures; still avoid scroll-snap–only UX that encourages drag). If using scroll, **disable** touch swipe affordance is not fully possible on web; **translate-based** deck is more predictable.

4. **Composition:** introduce a small **layout wrapper** (e.g. `ArticleExplorerModal.vue` or refactor `ArticleSidePanel.vue` into modal + slots) that owns primary tab state, secondary slide state, and passes **document** into child slide bodies. Reuse **`ArticleSummaryView`** internals via **extracted subcomponents** or **props** (`slide: 'main' | 'contacts' | 'map'`) to avoid duplicating data logic; avoid forking map/contact queries in two places.

5. **Global tab removal:** **`ArticleViewAI`** `tabItems` drops the fulltext entry and the `#full` template; any **deep links** or **tests** referencing the full tab must be updated. Full-page `/articles/:id` (if present) continues to use **`ArticleViewAI`** without modal.

6. **Decorative backgrounds:** implement as **non-interactive** absolutely positioned elements (`pointer-events-none`) with **`aria-hidden="true"`** so they do not steal focus or confuse screen readers; ensure **text contrast** meets WCAG on top of imagery (overlay scrim if needed).

**Alternatives considered**

- **Horizontal scroll-snap only:** rejected as primary navigation because it invites touch/trackpad horizontal scrolling (gesture-like) and is less discoverable than arrows + labels.
- **Separate modal-specific summary component:** possible if refactors balloon; prefer **parameterized** summary first to keep pin/selectable blocks consistent.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Modal blocks map interaction while open | Intended; ensure **close** control is obvious and **Esc** closes where Nuxt UI supports it. |
| Translate-based slides and focus order | On slide change, **move focus** to slide container heading or use **`aria-live="polite"`** for index updates. |
| `ArticleSummaryView` refactor regressions | Snapshot key scenarios (gallery, map empty, no contacts); manual QA on pin capture from summary blocks. |
| Missing `public/img/explorer` assets in repo | Gate decorative layers behind **optional** asset paths; ship layout with **solid fallback** until exports land. |
| Duplicate recipe rendering logic | **`ArticleStructuredView`** gains a **layout mode** prop (`stack` vs `slides`) or a thin **wrapper** that maps keys to slides without duplicating fetch/markdown. |

## Migration Plan

1. Land UI behind the same **open/close API** parents use today (`ArticleSidePanel` props/emit) to minimize caller churn.
2. Remove fulltext tab in **`ArticleViewAI`** in the same change set as modal shell (per proposal) so QA runs one consolidated regression pass.
3. Verify **explorer board** and **search** entry paths; grep for **`#full`**, **`tabs.full`**, or **`structured`/`full`** i18n keys and clean unused strings if obsolete.
4. Rollback: revert modal PR; feature flag not required unless release risk demands it.

## Open Questions

- Whether **open full article in new tab** (`UButton` with `/articles/:id`) stays in the modal header when fulltext is no longer in-app (likely **yes** for power users).
- Exact **Nuxt UI** primitive for vertical tabs vs custom Tailwind rail (finalize during implementation against installed Nuxt UI version).
- Whether **map slide** should be omitted entirely when there are **no map points** (recommended) or show an empty state slide.
