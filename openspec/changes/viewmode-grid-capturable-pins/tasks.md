## 1. Types and pin registry

- [ ] 1.1 Add `grid_compare_summary` to `PinCaptureBodyKind` in `apps/web/app/types/pinCapture.ts` (and any exhaustiveness helpers if present).
- [ ] 1.2 Map `grid_compare_summary` in `PinBodyRenderer.vue` to the same text renderer as `ai_summary` (or confirm a single branch covers both).
- [ ] 1.3 Add i18n key `pins.kinds.grid_compare_summary` (and any locale files the project uses for `pins.kinds.*`).
- [ ] 1.4 Extend `usePinsSupabase` / `mapBodyKindToBoardType` or board card typing if a new board “type” bucket is required for this kind (only if the existing path does not already handle unknown kinds safely).

## 2. Article context for grid cells

- [ ] 2.1 In `ViewModeGrid.vue` (or a small child component), `provide` `PinArticleContextKey` per card with `documentUid`, `title`, and `location` refs derived from the hit’s `document` (use `document_uid` from `apps/web/app/types/search` when present; `location` if the search document exposes coordinates used elsewhere for pins).
- [ ] 2.2 Verify `composedTitle` in `CapturableBlock` produces a useful `source_title_snapshot` (adjust `title` prop on the block if a shorter grid-specific label is needed for the second half of the title).

## 3. Replace legacy Pin with CapturableBlock

- [ ] 3.1 Remove `Pin` import and wrapper; remove `handlePinned` / `handleUnpinned` and related console-only code.
- [ ] 3.2 Wrap the pin-worthy body of each card in `CapturableBlock` with `pin-kind="grid_compare_summary"`, `source-view="grid_compare"`, a clear `title` (e.g. property label or “Custom compare”), `preview` from the primary markdown to show in the dialog, and a `payload` object including: `summary` and `data` from `getSummary(hit.id)` when present, `mode` (`property` | `custom`), `property` key when in property mode, and `promptHash` or equivalent for custom mode (reuse `hashPrompt` from `gridCompareSource` for stable identity), plus `articleTitle` from the hit.
- [ ] 3.3 Set `chrome` and layout classes so the card frame matches the rest of the explorer (avoid double padding per design “Open Questions” — pick one border/hover treatment).
- [ ] 3.4 Grep the repo for `ui/pin/Pin` and `from "@/components/explorer/ui/pin/Pin"`; document remaining call sites or remove the component in a follow-up if unused.

## 4. Masonry-like layout and readability

- [ ] 4.1 Replace the strict `grid grid-cols-*` container with a CSS multi-column layout (`columns-*`) and per-card `break-inside-avoid` (or the chosen alternative from `design.md`), keeping responsive breakpoints sensible next to the toolbar.
- [ ] 4.2 Remove `line-clamp-4` on the subtitle fallback path if the only reason was uniform row height; ensure empty states and very long unbounded text still look acceptable (add max-height + scroll only if product requires a cap).
- [ ] 4.3 Manually test: property mode, custom mode with submitted prompt, pagination, and checkbox-scoped targets; confirm no layout break on narrow viewports.

## 5. Verification

- [ ] 5.1 Create a grid compare pin with a known `document_uid` and confirm on `/explorer/board`: kind label, body text, `user_note` when added, and “open in explorer” (or document link) works.
- [ ] 5.2 Create a pin from a context without `document_uid` (if reproducible) and confirm degraded source messaging per existing rules.
- [ ] 5.3 Run the web app lint and typecheck for the touched package (`pnpm` filter as used in this monorepo).
