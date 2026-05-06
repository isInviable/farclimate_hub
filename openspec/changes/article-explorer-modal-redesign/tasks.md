## 1. ArticleViewAI and fulltext tab removal

- [x] 1.1 Remove the fulltext / `#full` tab item, template slot, and any `md.render(document.fulltext)` usage from `ArticleViewAI.vue`; keep summary, structured recipe, and chat only.
- [x] 1.2 Grep the web app for `tabs.full`, `#full`, fulltext tab routes, and tests; update or remove references so build and tests pass.
- [x] 1.3 Confirm full-page article routes still render `ArticleViewAI` in a non-modal layout with three tabs.

## 2. Blocking modal shell

- [x] 2.1 Replace `USlideover` in `ArticleSidePanel.vue` with a blocking `UModal` (or equivalent) while preserving props (`document`, `documentUid`, `open`, `pins`, etc.) and `close` emit behavior for callers.
- [x] 2.2 Remove or replace body scroll lock hacks that existed only for the slide-over if the modal component handles overflow; verify no double scroll lock on open/close.
- [x] 2.3 Wire modal header actions (title, external open-in-new if retained, close) to match Figma and accessibility (dialog title/description).

## 3. Primary vertical tabs and layout

- [x] 3.1 Implement vertical primary tab rail (summary / recipe / chat) in the modal content top-left using Nuxt UI where possible and Tailwind for spacing.
- [x] 3.2 Ensure primary tab structure leaves room for future animation (no hard-coded transitions required in v1).

## 4. Horizontal slide system (shared)

- [x] 4.1 Add controlled slide state (active index per primary tab or reset policy per design.md), previous/next `UButton` controls with disabled edges, and horizontal subsection label row.
- [x] 4.2 Implement slide body container with full-width slides and `overflow-y-auto` for vertical overflow; use translate or equivalent so slide changes do not depend on swipe.
- [x] 4.3 Add basic a11y: focus management or `aria-live` for slide changes; decorative backgrounds `pointer-events-none` and `aria-hidden`.

## 5. Summary slides

- [x] 5.1 Split summary content into **main**, **contacts and references**, and **map** slides (refactor `ArticleSummaryView` or extract subcomponents; avoid duplicating data fetching).
- [x] 5.2 Implement **main** slide gallery as a horizontal strip (scroll/wrap per design); remove grid layout for that strip in modal context.
- [x] 5.3 Wire **map** and **contacts/references** slides to existing data; add empty states per spec.
- [x] 5.4 Apply decorative corner backgrounds from `public/img/explorer` where Figma specifies; add assets to repo if missing and use safe fallbacks.

## 6. Recipe slides (modal only)

- [x] 6.1 Add a modal-only layout mode or wrapper around `ArticleStructuredView` so each non-empty canonical recipe key renders as its own horizontal slide with shared submenu + arrows.
- [x] 6.2 Preserve `/api/document-recipe` fetch behavior, markdown options, and canonical key order from existing implementation; do not change API contracts.

## 7. Pins and text selection

- [x] 7.1 Wrap modal tab bodies with `ArticleTextSelectionCapture` (or equivalent) so selection and pin capture paths match pre-change behavior.
- [x] 7.2 Manually verify pin creation from summary selectable blocks, recipe content where applicable, and chat from the modal.

## 8. QA and cleanup

- [x] 8.1 Verify explorer board (and any other callers) open/close the modal and that the map behind is not interactive while open.
- [x] 8.2 Run lint/tests for `apps/web`; fix i18n gaps for new labels if any.
