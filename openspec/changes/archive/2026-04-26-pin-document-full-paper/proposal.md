## Why

Pins that represent an entire catalog document are currently created with the same `body_kind` semantics as in-document excerpts (for example `text_segment` via DOM capture), so the pinboard and search flows cannot distinguish a **whole paper** from a **fragment**. Product needs a dedicated persisted `body_kind`, consistent capture APIs, and UI to surface full-paper pins separately.

## What Changes

- Standardize **`body_kind: "document"`** for full-catalog-document pins only; require **`source_document_uid`** and **`user_note`** per existing product rules for pin inserts.
- **Search results**: the pin control on a search hit SHALL create a `document` pin using the explicit **`pinCapture`** (or equivalent) payload path—not legacy **`pinContent`** / DOM wrapper capture for that flow.
- **Document preview and full article layouts**: add an explicit **Pin document** (or equivalent) action with the same persisted shape as search-hit pinning.
- **Pin board / sidebar** (`BoardList.vue` and related): add a **filter or category** that lists only pins where `body_kind === "document"` (labels via i18n).
- **Types and mapping**: extend `PinCaptureBodyKind` (or equivalent) with `"document"`; keep **`mapBodyKindToBoardType`** / board list behavior coherent for list display and the new filter.
- **Dedupe / “already pinned”**: align **`isDocumentPinned`** (and related helpers) with product intent—treat “document pinned” as presence of a **`document`** pin for that `source_document_uid`, distinct from “any fragment pin” on the same document (see design).
- **Migration**: none; no production users; legacy rows may be ignored.

## Capabilities

### New Capabilities

- None (behavior is an extension of existing pinboard and explorer pinning).

### Modified Capabilities

- **`human-pins-frontend`**: New normative rules for `document` pins (data model, allowed write paths, board filtering, capture API alignment, and coherence of document-level vs fragment-level “pinned” indicators).

## Impact

- **`apps/web`**: explorer search hit pinning, document preview / article layouts, `usePin` / `pinCapture` utilities, `Pin.vue` / `pinContent` call sites (search must not use fragment path), `BoardList.vue` (or successor sidebar), `usePinsSupabase` (`isDocumentPinned`, `mapBodyKindToBoardType`, optional new helper), pin body renderer registry / `PinBoardCard`, i18n keys under `pins.kinds.*` and filter copy.
- **Database / RLS**: no schema change expected if `body_kind` remains a free string on `human.pins`; confirm no check constraint blocks `"document"`.
