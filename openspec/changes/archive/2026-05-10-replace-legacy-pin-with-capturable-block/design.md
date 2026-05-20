## Context

The legacy `Pin` wrapper tied DOM capture to ad hoc props (`pin-id`, `pin-title`, `pin-type`, `pin-data`). It was deleted assuming only the removed presentation page still used it. **List** and **Instagram** explorer viewmodes still referenced `<Pin>`, breaking the app. **`CapturableBlock`** already implements the supported flow: optional chrome, `PinCaptureDialog`, `usePin().pinCapture`, and injection of **`PinArticleContext`** for `source_document_uid` / location. **`ViewModeGridHitContext`** provides a minimal `provide` pattern per hit document.

## Goals / Non-Goals

**Goals:**

- Restore working pin UX on list and Instagram viewmodes using **`CapturableBlock`** (or thin wrappers that delegate to it).
- Provide **`PinArticleContext`** for each hit that exposes `document_uid` / title / location so pins match **`human-pins-frontend`** expectations.
- Confirm **no** remaining `<Pin>` component references in `apps/web`.

**Non-Goals:**

- Redesign list or Instagram layouts beyond what is required to swap pin mechanics.
- Changing `body_kind` taxonomy beyond choosing an appropriate existing kind for “title line” / bookmark pins (default **`text_segment`** unless product dictates otherwise).
- Restoring deleted files (`Pin.vue`, presentation page).

## Decisions

1. **Per-hit context via `ViewModeGridHitContext` (or duplicate)**  
   **Rationale**: Same data shape as grid compare (`document_uid`, `title`, `location`). Wrapping each hit’s capturable region (or the row) with `ViewModeGridHitContext` avoids prop-drilling and matches [`pinContext.ts`](apps/web/app/components/explorer/pinContext.ts).  
   **Alternative**: Inline `provide` in each viewmode — rejected as duplicated logic.

2. **List mode: wrap the title block with `CapturableBlock`**  
   **Rationale**: Mirrors prior `<Pin>` scope (title only). Use `:title` / `:payload` with document title and optional structured payload; `:chrome="false"` if the row already has editorial styling (match existing visual weight).  
   **Alternative**: Chrome card inside list — rejected to avoid double borders.

3. **Instagram mode: `CapturableBlock` with `#pin` slot**  
   **Rationale**: Preserve bookmark **icon** appearance while using capturable behavior—override default pin button with slot content (same pattern as customizable slots in `CapturableBlock`).  
   **Alternative**: Always use default pin button — rejected for UX regression.

4. **Pin kind**  
   Use **`pin-kind="text_segment"`** (default) for title/bookmark text pins unless an existing dedicated kind exists for “search hit title”; align with `CapturableBlock` `bodyKind` mapping.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Pinned-state detection** (`isPinned`) differs from legacy `Pin` | Rely on `CapturableBlock` + `usePinsSupabase` match rules; verify badge/hover state against a document that already has a pin. |
| **Hit without `document_uid`** | Context yields `null` uid; pins remain valid with degraded board behavior per `human-pins-frontend`. |
| **Accessibility**: Instagram icon-only control | Keep **`aria-label`** via i18n (`pins.capture.buttonAria` or viewmode-specific key if needed). |

## Migration Plan

1. Implement viewmode changes on a branch; run `pnpm run build` in `apps/web`.
2. Manually smoke-test: list + Instagram pin from hit with known `document_uid`, confirm row on board and “Open in explorer” when applicable.
3. Deploy frontend only; no DB migration.

## Open Questions

- Whether list title pins need a **distinct** `body_kind` for analytics (e.g. `search_hit_title`) — product call; default stays **`text_segment`** unless types extend.
