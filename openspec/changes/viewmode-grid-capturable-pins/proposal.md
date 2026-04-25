## Why

The grid comparison view (`ViewModeGrid.vue`) still wraps each article card with the legacy `Pin` component (`apps/web/app/components/explorer/ui/pin/Pin.vue`), which predates the capturable-pinning model: it relies on ad hoc handlers and does not send structured `body.data` for AI-generated cell content. At the same time, the current CSS grid uses uniform row heights and a `line-clamp` fallback, which fights long compare blurbs and makes dense summaries hard to read. We should align this Explorer surface with the same explicit capture flow and payload typing used elsewhere, and let the layout breathe for variable-length summary text.

## What Changes

- Replace the legacy `Pin` wrapper on grid cards with `CapturableBlock` (or an equivalent article-context-aware capturable) so users pin **explicitly** with the note-capable capture dialog and a **dedicated** `body_kind` (and typed payload) for grid compare / AI cell summaries—distinct from generic `text_segment` and clearly identifiable on the pinboard.
- Rework the results layout from a strict equal-height grid to a **masonry-like** column layout (e.g. CSS multi-column with `break-inside-avoid` on cards, or another documented approach) so cards can grow vertically with full summary text; remove `line-clamp` **where** it is only there to fit the old fixed grid (subtitle-only fallback behavior may stay readable per design).
- Remove `handlePinned` / `handleUnpinned` no-ops and any remaining legacy pin wiring in this file; ensure document context (`source_document_uid`, `source_title_snapshot`) is supplied per `human-pins-frontend` rules for Explorer-known documents.
- Register the new `body_kind` in pin capture types, `PinBodyRenderer` (or equivalent), i18n for `pins.kinds.*` if the board shows kind labels, and any Supabase client mapping that maps `body_kind` → board card type—only as needed for consistent rendering.
- **Optional / follow-up**: Note other Explorer viewmodes that still use the old `Pin` pattern so they can be migrated in a consistent order; this change **implements** the grid first.

## Capabilities

### New Capabilities

- None. Behavior extends existing explorer grid compare and human-pins front-end capabilities.

### Modified Capabilities

- `explorer-viewmode-grid-compare`: Add requirements for masonry-like layout, removal of legacy pin components from the grid, and capturable-based pinning for generated compare content with a dedicated pin kind.
- `human-pins-frontend`: Add or clarify requirements for grid-compare / AI cell captures: explicit `body_kind`, structured `body.data` (e.g. property key, custom prompt hash, `data` / `summary` fields from the summarize response), and mandatory source document fields when the card’s article `document_uid` is known (Explorer grid).

## Impact

- **Frontend**: `apps/web/app/components/explorer/wf/viewmodes/ViewModeGrid.vue`, `CapturableBlock.vue` usage patterns, `types/pinCapture.ts`, `PinBodyRenderer.vue`, i18n keys under `pins.kinds` if new kind label is shown, and possibly `composables` that build pin payloads (mirroring `ViewModeChat` / article flows).
- **APIs**: No new routes; reuse existing `summarizePropertyBatch` response fields inside the pin payload.
- **Database**: None; `human.pins` shape unchanged, new `body_kind` value only in application code.
