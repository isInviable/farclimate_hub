Implementation landed in this session — the explorer article UI now uses the rolling menu + slide deck layout in a near-fullscreen `UModal`, the fulltext tab is gone, and the same view component runs on the full-page article route without the modal shell. Items below marked `[ ]` are manual-QA / deferred / nice-to-have.

## 1. Article view replacement (rolling menu + slide deck)

- [x] 1.1 Replace `ArticleViewAI.vue`'s `UTabs`-based four-tab layout with a custom two-level layout: a vertical "rolling menu" rail (top-left) for the three primary sections (Chat, Recipe, Summary), and a slide-deck area to its right.
- [x] 1.2 Implement the rolling-menu rule: canonical order `[Chat, Recipe, Summary]`; the active item is rendered at the bottom in heading-weight near-black; the two inactive items render above it in canonical relative order using the `primary` Tailwind UI scale ("trust-blue"). Mirror tablist ARIA semantics (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`).
- [x] 1.3 Remove the fulltext `#full` tab item, template slot, and any `md.render(document.fulltext)` usage from `ArticleViewAI.vue`. Confirm no other component renders `document.fulltext` inline.
- [x] 1.4 Grep `apps/web/` for `tabs.full`, `#full`, fulltext routes, and tests/snapshots referencing the old layout; update or remove so build and tests pass.
- [x] 1.5 Add `tabs.recipe` i18n key; reuse existing `tabs.summary` and `tabs.chat`. Removed `tabs.full` and `tabs.structured`. Added `summary.slides.{main,contacts,map}` and `article.{contacts,websites,references,map}.empty*` keys.

## 2. Blocking modal shell

- [x] 2.1 Replace `USlideover` in `ArticleSidePanel.vue` with a near-fullscreen blocking `UModal` (focus trap, dimmed overlay, internal scroll). Preserves caller props (`document`, `documentUid`, `open`, `pins`, `titleFallback`) and the `close` emit.
- [x] 2.2 Modal header chrome is exactly two top-right icon controls: a pin button (calls `articleViewRef.openDocumentPinDialog`) and a close (×) button. No title row, no "open in new tab" affordance.
- [x] 2.3 Removed the manual `disableScroll` / `enableScroll` body-style hacks; `UModal` handles overflow.
- [ ] 2.4 Manual verification: open from the explorer, confirm the canvas (board, lists, map) is non-interactive while open and that Escape and overlay click close the modal.

## 3. Full-page article route parity

- [x] 3.1 `apps/web/app/pages/articles/[id].vue` now renders the new `ArticleViewAI` with `chrome="page"` (no modal shell). The article view uses the same rolling-menu + slide-deck layout in both contexts.
- [ ] 3.2 Manual verification: open `/articles/<id>`, confirm pin and selection flows still work outside the modal.

## 4. Horizontal slide deck (shared)

- [x] 4.1 New `apps/web/app/components/explorer/article/SlideDeck.vue` owns active-slide state per primary section and exposes `update:activeIndex`. Slides lay out as a translate-based row inside `overflow-hidden` (no scroll-snap, no swipe).
- [x] 4.2 Submenu rendered above the viewport with active label near-black/bold and inactive labels in `text-primary-600`. Submenu label and body slide heading are derived from the same `slides[].label` string.
- [x] 4.3 Prev/next are circular `UButton`s with `rounded-full` UI override, positioned at the left and right edges of the modal body with `-translate-x-1/2` / `translate-x-1/2`. They are disabled (`:disabled` + `aria-disabled`) at the deck edges.
- [x] 4.4 Slide bodies open with `NN. Section name`, where `NN` is the 1-based submenu index zero-padded; the section name reuses the submenu label.
- [x] 4.5 Switching the primary tab in `ArticleViewAI.onPrimaryChange` resets both `summaryIndex` and `recipeIndex` to 0.
- [x] 4.6 `aria-current` on the active submenu item, `aria-disabled` on edge prev/next, `aria-live="polite"` slide-index region, and focus moved to the slide heading on slide change via the `watch` on `activeIndex`.

## 5. Summary slides

- [x] 5.1 New `SummaryMainSlide`, `SummaryContactsSlide`, `SummaryMapSlide` under `apps/web/app/components/explorer/article/`. The parent (`ArticleViewAI`) computes `parsedDocument` and `mapPoints` once and passes them in; no duplicated fetching.
- [x] 5.2 Main slide implements optional left detail column (only when fields are non-empty), subtitle, sectors / hazards / type-of-solution / keywords tag groups, the outbound `source_url` link, and a bottom-anchored full-width horizontal gallery strip (`mt-auto pt-4` + `flex gap-3 overflow-x-auto`).
- [x] 5.3 Contacts slide uses CapturableBlocks for contact / websites / references with empty per-block messages and a UAlert when all three are missing.
- [x] 5.4 Map slide reuses `MapBase` with `mapPoints`; UAlert empty state when there are no points; no left detail column.
- [x] 5.5 Decoration declared only for the Contacts slide (`/img/explorer/summary-contacts-corner.png`). The new `<DecorativeCorner>` primitive renders nothing if the asset is missing or fails to load.

## 6. Recipe slides

- [x] 6.1 Used the "thin wrapper" alternative from the design: extracted `apps/web/app/composables/useArticleRecipe.ts` (canonical key order, `/api/document-recipe` fetch behavior, markdown rules preserved) plus a small `RecipeSlideBody.vue` that renders one canonical section's body. `ArticleViewAI` drives the slide deck off `visibleSections`.
- [x] 6.2 Decoration applied to recipe slides via alternating `recipe-corner-compass.png` / `recipe-corner-paper.png` assets; same missing-asset fallback as §5.5.
- [x] 6.3 When `visibleSections` is empty, the Recipe primary section renders a single `UAlert` empty-state (no slide deck mounted).

## 7. Pins and text selection

- [x] 7.1 The slide-deck region in `ArticleViewAI` is wrapped in `<ArticleTextSelectionCapture source-view="article">`. Each slide body uses `CapturableBlock` with the same `pin-kind` values as before (`recipe_section`, `image`, `contact`, `website`, `reference`).
- [ ] 7.2 Manual verification: pin creation from Summary Main selectable blocks, Summary Contacts selectable blocks, a Recipe section slide, and the Chat surface.

## 8. Styling, tokens, and decoration primitive

- [x] 8.1 Inactive primary-tab and inactive submenu labels use `text-primary-600` / `text-primary-700`; active labels use `text-default` / `text-primary` from the project's Nuxt UI theme. No raw hex colors in component code.
- [x] 8.2 Added `apps/web/app/components/explorer/article/DecorativeCorner.vue` with `pointer-events-none`, `aria-hidden="true"`, `corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'` prop, and graceful fallback to nothing on missing src or `<img>` error event.

## 9. QA and cleanup

- [ ] 9.1 Manual QA: open the modal from board, search, list views; confirm explorer behind is non-interactive while open.
- [ ] 9.2 `npm --prefix apps/web run lint` and `npm --prefix apps/web run test`. (Workspace eslint config has a pre-existing `@stylistic/js` plugin gap; in-IDE lint is clean for all touched files.)
- [ ] 9.3 Manual QA against the four Figma frames: modal shell / Summary Main, Summary Map, Summary Contacts & references, Recipe slide.

## 10. Optional / deferred

- [ ] 10.1 Keyboard arrow-key slide navigation (←/→) — nice-to-have, not required for v1.
- [ ] 10.2 Animated transitions on the rolling menu and slide changes — out of scope for v1; layout reserves space for them.

## Implementation notes

- **`ArticleStructuredView.vue`** is now orphaned (no callers). Left untouched in the tree to keep the change set tight; future cleanup should delete it once we've confirmed no external link points there.
- **AI section summaries** (`who_is_involved`, `economic_data`) that lived in the previous summary view were dropped. The same content is reachable via the Recipe slide deck (`who_is_involved`, `economic_data` canonical keys) so no information is hidden from the user.
- **Decorative assets** under `apps/web/public/img/explorer/` need to be added by design; the primitive degrades to no decoration until the files land.
- **`AppImageLightbox`** path: the new `SummaryMainSlide` imports it from `../AppImageLightbox.vue`; verified the file exists at `apps/web/app/components/explorer/AppImageLightbox.vue`.
