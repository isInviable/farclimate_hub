## Context

`ViewModeGrid.vue` implements the Explorer **grid compare** view: users pick a property or a custom question, and the UI shows one card per search hit with optional LLM blurbs from `POST /api/summarizePropertyBatch`. The file currently wraps each card in `Pin` from `apps/web/app/components/explorer/ui/pin/Pin.vue`, which predates the capturable flow: it uses `usePin` with DOM-oriented behavior, logs stub handlers, and does not align with `PinCaptureDialog` + structured `body.data` used by `CapturableBlock` in `ViewModeChat.vue` and article surfaces.

The capturable-pinning archive change (`2026-04-25-capturable-pinning-flow`) established `CapturableBlock`, explicit payloads, and optional notes. Grid compare is a natural next surface: each cell’s pin-worthy content is **already** structured (API `summary` / `data` strings, mode, property key, custom prompt context).

Layout-wise, the view uses `grid grid-cols-*` with cards that can hold long markdown; subtitle mode uses `line-clamp-4` on the fallback path, and equal-width columns do not pack variable-height content as efficiently as a masonry column flow.

**Constraint:** `CapturableBlock` reads `PinArticleContextKey` for `source_document_uid` and `source_title_snapshot` composition. `ArticleViewAI` provides this context today; the grid view does not. The implementation **must** `provide` a per-card (or per-row) context whose `documentUid` and `title` refs map from the search hit’s `document.document_uid` and `document.title` (and `location` from the document when the hit exposes coordinates), so pins created from the grid are not degraded “source missing” pins when the UID is known.

## Goals / Non-Goals

**Goals:**

- Remove `Pin` (legacy UI pin) and stub `handlePinned` / `handleUnpinned` from the grid.
- Use `CapturableBlock` with `chrome` appropriate to the card (likely `true` to match other explorer cards, or a documented variant) and a **dedicated** `pinKind` / `body_kind` (e.g. `grid_compare_summary`) so pinboard sectioning and analytics can distinguish these pins from `ai_summary` inside a single article.
- Pass an explicit `payload` that includes: comparison mode metadata (`property` key vs `custom` + stable prompt identity), the rendered `data` and `summary` strings from the summarize response when present, the article title, and a `sourceView` marker such as `grid_compare` for traceability.
- Apply a **masonry-like** layout: CSS multi-column layout (`columns-*`) with `break-inside-avoid` on each card, or an equivalent documented pattern that allows variable card heights without forcing a single row height across the row. Remove aggressive clamping whose only purpose is to **hide** long compare text; keep typography readable (prose, spacing).
- Register the new kind in the pin render registry (`PinBodyRenderer` → `PinRenderText` is acceptable if the payload is markdown-like) and add a `pins.kinds.*` i18n entry if kind labels are shown.
- Update `types/pinCapture.ts` to include the new `PinCaptureBodyKind` literal for type safety.

**Non-Goals:**

- No database migrations or new API routes.
- No change to summarize batch contracts beyond consuming existing fields in the pin payload.
- Wider migration of other Explorer viewmodes in this change (noted in proposal for follow-up).
- Perfect Pinterest-style bin-packing: CSS columns “masonry” is acceptable; JavaScript virtual masonry libraries are out of scope unless a future change requires them.

## Decisions

### 1. Dedicated `body_kind`: `grid_compare_summary`

**Choice:** Introduce a distinct `body_kind` (e.g. `grid_compare_summary`) rather than overloading `ai_summary`.

**Rationale:** Article-hosted AI blurbs and Explorer grid cells have different `sourceView` and metadata (page vs property dropdown, custom prompt hash). A distinct kind keeps pinboard filters and future analytics clear.

**Alternative:** Reuse `ai_summary` with `sourceView: 'grid_compare'` in `body.data` only — fewer registry entries, weaker filtering by kind.

### 2. Article context via `provide` on each card

**Choice:** Wrap each card (or the capturable subtree) with a small component or `provide(PinArticleContextKey, { documentUid, title, location })` using refs derived from the hit.

**Rationale:** Reuses `CapturableBlock` unchanged and satisfies `human-pins-frontend` source linking rules for Explorer-known documents.

**Alternative:** Extend `CapturableBlock` with optional `sourceDocumentUid` props — more API surface; avoid unless other surfaces need it.

### 3. Masonry: CSS multi-column

**Choice:** Container with `columns-1 md:columns-2 xl:columns-3` (exact breakpoints to match current density), each child with `break-inside-avoid` and `mb-*` for gutter.

**Rationale:** No new dependency, works with server-rendered lists, good enough for “taller cards in a flowing layout.”

**Alternatives:** CSS Grid `grid-template-rows: masonry` — limited browser support. Masonry.js / `vue-masonry` — extra dependency and hydration considerations for Nuxt.

### 4. Deprecate `ui/pin/Pin.vue` only at call site

**Choice:** Remove usage from `ViewModeGrid.vue` only; do not delete the component in this change if other files still import it (verify with a repo search).

**Rationale:** Scoped change; deleting the component can be a follow-up once unused.

## Risks / Trade-offs

- **Column order vs reading order** — CSS columns fill vertically first; screen-reader / keyboard order may differ from “row by row.” **Mitigation:** Keep a single column on small viewports; document in tasks that visual order is column-major on `md+`; if product requires strict row order, fall back to CSS grid with `auto-rows` min-content (not true masonry) as a product call.
- **Per-card `provide` overhead** — Negligible for page size (tens of items).
- **Unknown `document_uid` on some hits** — **Mitigation:** Pass `null` and accept degraded board state for those rows only, consistent with existing spec for pins without host article.

## Migration Plan

1. Implement `GridCompareCard` (optional) or inline `provide` + `CapturableBlock` in `ViewModeGrid.vue`.
2. Switch layout classes; verify subtitle and LLM paths both look acceptable.
3. Add `body_kind` + renderer + i18n; run pin create from grid and confirm board + map rules.
4. Grep for `from .../ui/pin/Pin` and remove or schedule removal.

**Rollback:** Revert the Vue file and spec deltas; no data migration.

## Open Questions

- Exact i18n label for `pins.kinds.grid_compare_summary` (product wording).
- Whether `chrome` on `CapturableBlock` should be `false` to avoid double borders with the existing card frame (visual polish during implementation).
