## Context

Today the explorer opens documents in `ArticleSidePanel.vue`, a non-modal `USlideover` that embeds `ArticleViewAI`, which uses `UTabs` with four tabs (summary, structured recipe, fulltext, chat). Summary content is a single column with a multi-column image grid. Figma handoff defines a near-fullscreen blocking modal with a two-level navigation pattern: a vertical "rolling menu" of three primary sections (Chat, Recipe, Summary) where the active item is rendered at the bottom of the rail in a heading-sized active style, plus a horizontal submenu of slides with prev/next circular arrows. The fulltext tab is removed entirely; access to the original article is via the existing outbound `source_url` link surfaced from the Main summary slide.

Because the new layout fully replaces the current article UI in every caller (explorer modal and full-page routes), the change touches `ArticleViewAI` directly, not just a modal wrapper.

## Goals / Non-Goals

**Goals**

- Ship a near-fullscreen blocking `UModal` for explorer article inspection with internal scroll, pin and close chrome, focus trap, and keyboard-/screen-reader-friendly defaults.
- Implement a **rolling-menu** primary tab rail (active at bottom, large bold near-black; inactive above in `primary` Tailwind UI scale) and a horizontal submenu + prev/next arrow secondary deck. No swipe / drag / scroll-snap.
- Split summary into three horizontal slides (main with bottom image strip, contacts & references, map). Recipe renders one slide per canonical non-empty section.
- Replace `ArticleViewAI`'s `UTabs` layout in **all** callers — there is one article view, not two.
- Keep `ArticleTextSelectionCapture` and pin flows behaviorally equivalent to the current explorer article path.
- Apply decorative corner backgrounds only to text-heavy slides; map and gallery-bearing slides ship without decoration.

**Non-Goals**

- Animations on the rolling menu or slide transitions in v1; layout must reserve room for them.
- Changing recipe JSON schema, chat API, or document fetch contracts.
- Keyboard arrow-key slide navigation (nice-to-have, not v1).
- Inline rendering of `document.fulltext` anywhere in the app.

## Decisions

1. **Shell**: `UModal` with `modal: true`, near-fullscreen sizing (e.g. `max-w-[1280px] w-[min(1280px,calc(100vw-2rem))] h-[min(1155px,calc(100vh-2rem))]` or equivalent Tailwind utility classes consistent with project conventions), internal `overflow` on the body. Overlay click and Escape close the modal where Nuxt UI defaults allow it. Header chrome is exactly two icon buttons in the top-right: pin and close (×).

2. **Two-level navigation**

   - **Primary "rolling menu"** (top-left of the modal body): canonical order is `[Chat, Recipe, Summary]`. The **active item moves to the bottom** of the rail; the two inactive items keep their canonical relative order above it. Inactive labels use the `primary` Tailwind UI scale ("trust-blue") at the smaller, link-style weight; the active label uses near-black at the heading weight (Figma: ~47px bold). This is **not** Nuxt UI's vertical `UTabs` — the asymmetric active styling and active-at-bottom positioning warrant a small custom Tailwind component, but its underlying state and ARIA roles SHOULD mirror tabs (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`).

   - **Secondary submenu** (top of the slide content area): horizontal list of slide labels for the active primary section, plus two circular **prev/next arrow buttons** vertically centered against the slide body, positioned at the **left and right edges of the modal body** (outside the slide content padding, as in Figma: ~48px circles ~y=640 of a 1155px frame). Disabled state at first/last slide. Active submenu label is bold/dark; inactive labels use the `primary` scale.

3. **Slide deck**: implemented as a controlled active-slide index per primary tab plus translate-based panel switching (`translateX` on a flex row inside an `overflow-hidden` viewport). This avoids horizontal trackpad scroll being read as gesture navigation. Each slide owns its own vertical scroll (`overflow-y-auto`).

4. **Per-tab slide state**: switching the primary tab **resets** the secondary slide index to the first slide of the new tab. Within a primary tab, the secondary state is preserved while the modal stays open.

5. **Slide title pattern**: each slide body opens with the heading `NN. Section name`, where `NN` is the 1-based index of the slide in the current submenu (rendered in a muted/grey number style as in Figma) and `Section name` is the same string used in the submenu. Implementation derives both from a single source so they cannot drift.

6. **Summary composition**: refactor `ArticleSummaryView` into three slide bodies (`SummaryMainSlide`, `SummaryContactsSlide`, `SummaryMapSlide`) sharing a single data hook so map points / gallery URLs / contacts / references are fetched and memoized once. The Main slide's hero column may be flanked by an **optional left detail column** (Date / Geographic Characterisation / Bio geographical region) populated only from fields available on `ArticleDetail`; this column is per-slide, not a persistent rail across the deck. The gallery is a single horizontal strip pinned to the bottom of the Main slide body, full-width, horizontally scrollable on overflow.

7. **Recipe composition**: extend `ArticleStructuredView` (or introduce a thin slide wrapper) with a `layoutMode: 'stack' | 'slides'` prop. In `slides` mode, the same canonical key list and markdown rules drive one slide per non-empty section; ordering is whatever `explorer-structured-recipe` defines today. No fetch logic is duplicated.

8. **Fulltext removal**: `ArticleViewAI` drops the `#full` tab and any `md.render(document.fulltext)` rendering. The `explorer-article-source-link` capability already mandates an outbound `source_url` link from the summary surface; the new Main slide is where it lives. No new "Original" slide is added.

9. **Decorative backgrounds**: add a small `<DecorativeCorner>` primitive that takes an asset path and a corner anchor (`bottom-right`, etc.). Used only on text-heavy slides — Contacts & references and each Recipe slide. Map and the Main slide (which carries the gallery strip) ship without decoration. Decorative layers use `pointer-events-none` and `aria-hidden="true"`; missing assets degrade to no decoration without breaking layout.

10. **Color tokens**: inactive primary-tab labels and inactive submenu labels use the **`primary`** Tailwind UI scale ("trust-blue") configured in `apps/web/app/app.config.ts`. Active states use the project's near-black foreground token (e.g. `text-default` / `text-(--ui-text)`). No raw hexes in component code.

**Alternatives considered**

- **Keep an "Original" slide for `document.fulltext`**: rejected — fulltext is not curated for in-app reading and we already link to the canonical source.
- **Vertical `UTabs` for the primary rail**: rejected because the active-at-bottom + active-as-heading styling is asymmetric and not expressible cleanly via the default `UTabs` orientation. ARIA semantics still mirror a tablist.
- **Horizontal scroll-snap for the slide deck**: rejected as primary navigation; trackpads would interpret it as gesture nav and the design explicitly calls for arrows + labels.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Replacing `ArticleViewAI` everywhere risks regressions on full-page article routes | Land the new component in one PR, walk every caller, run lint/tests, and manually QA `/articles/:id` (or equivalent) routes |
| Custom rolling-menu component diverges from Nuxt UI defaults | Mirror tablist ARIA semantics; small surface; document keyboard expectations even if not all are wired in v1 |
| Translate-based slides and focus order | On slide change, move focus to the slide heading or expose an `aria-live="polite"` slide-index region |
| Bottom-anchored gallery strip overflowing on narrow heights | Use `min-h-0` on the slide body and let the strip use horizontal scroll; the modal already scrolls internally |
| Missing decorative assets in `public/img/explorer` | Gate decorative layer behind the asset path; render nothing if absent; track asset list in tasks |
| Two callers (modal + full page) of one article component | Component takes a `chrome: 'modal' \| 'page'` prop or its parent renders the chrome; internal layout is identical |

## Migration Plan

1. Land the new `ArticleViewAI` (rolling menu + slide deck) and refactored summary / recipe slide bodies behind the same caller API the side panel uses today (`document`, `documentUid`, `pins`, `open`, `close`).
2. Swap `USlideover` → `UModal` in `ArticleSidePanel.vue` in the same change set; remove the explorer-specific body scroll-lock hacks if `UModal` handles overflow.
3. Update full-page article routes to render the same component without the modal shell.
4. Grep and remove `#full`, `tabs.full`, `md.render(document.fulltext)`, and any tests/snapshots referencing the fulltext tab.
5. Add or verify decorative assets under `apps/web/public/img/explorer/`; ship safe fallbacks.
6. Manual QA of the explorer board entry path: open → navigate primary tabs → navigate slides → pin from selection → close → confirm explorer canvas regains interactivity.
7. Rollback path: revert the change set; no data migrations involved.

## Open Questions (resolved)

All previously open questions are now closed:

- Original article access: **via the outbound `source_url` link on the Main slide**, not a dedicated slide.
- Primary rail primitive: **custom Tailwind component with tablist ARIA**, not Nuxt UI vertical `UTabs`.
- Empty Map: **slide remains reachable, shows empty state**.
- Modal size: **near-fullscreen `UModal` with overlay and internal scroll**.
- Slide-state reset on tab change: **reset to first slide**.
- Empty data on any slide: **show empty state**.
- Slide title numbering: **comes from submenu order**, body heading and submenu share one source string.
- Decorations: **only on text-heavy slides** (Contacts & references, Recipe slides); not on Map or the Main slide's gallery strip.
- Active vs inactive primary tab color: **active = near-black**; inactive = `primary` Tailwind UI scale.
- Keyboard slide nav: **nice-to-have**, not required for v1.
