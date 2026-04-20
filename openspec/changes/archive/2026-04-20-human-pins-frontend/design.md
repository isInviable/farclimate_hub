## Context

- **DB:** `human.pins` with `body_kind`, `body` (`v: 1`, `data`), `user_note`, `sort_order`, optional `source_document_uid` / `source_title_snapshot`.
- **API:** `supabase.schema('human').from('pinboards'|'pins')` only (see `openspec/specs/human-pinboards-pins`).
- **Legacy mock:** `usePinsStore` (`stores/pins.ts`) holds `PinnedItem[]` in memory; `usePin()` pushes into it; `useProjectsStore.saveCurrentProjectPins()` is a no-op stub still called from the pins store.

## Goals / Non-Goals

**Goals:**

- Single source of truth: pins from Supabase per project pinboard.
- UX summary from proposal: sections by `body_kind` in UI only, resolution + source missing, chat thread renderer, reorder `sort_order`, image flow documented toward server route.
- Delete mock store and strip dead calls; explorer pin UI reads/writes `human.pins` when authenticated.

**Non-Goals:**

- `human.pinboard_sections` table.
- Realtime chat for chat pins.
- Mandatory image MVP in first slice (spec allows deferral with documented secure path).

## Decisions

1. **Replace `usePinsStore`:** Prefer `usePinsSupabase` composable (+ optional thin Pinia cache keyed by `projectId` if needed). Do not keep parallel mock state.
2. **`usePin()`:** Either remove or reimplement to insert a `human.pins` row (with `body_kind` / snapshot from current document context) instead of `pinsStore.pinItem`. If explorer “pin selection” is deferred, remove imports and UI entry points until the insert path exists.
3. **`saveCurrentProjectPins`:** Remove method and all callers once mock store is gone.
4. **Projects page metrics:** `pinCountForProject` / `totalPins` today use mock length — replace with Supabase counts or remove widgets until composable exposes counts.
5. **Resolution:** Use existing search/document APIs where possible; cache resolve result per pin in component state.
6. **Reorder:** `sort_order` integers; persist on drop or button; batch optional.

## Risks / Trade-offs

- **Explorer breakage** while migrating — implement composable first, then switch one surface at a time.
- **No migration** from mock pins to DB (mock was never persisted meaningfully); users start fresh in DB.

## Migration Plan

1. Add `usePinsSupabase` + types.
2. Wire one primary board view to Supabase.
3. Remove `stores/pins.ts`, fix imports, remove `saveCurrentProjectPins`.
4. Update or remove `usePin()` and Pin component behavior.
5. i18n + polish.

## Open Questions

- Exact route(s) for board vs inline explorer panel.
- Minimum `body_kind` renderers for v1 beyond `chat` + generic.

## Archive (2026-04-20)

Change archived with implementation partially complete. Outstanding work and bug triage notes: **`REMAINING.md`** in this directory. Canonical requirements remain in **`openspec/specs/human-pins-frontend/spec.md`**.
