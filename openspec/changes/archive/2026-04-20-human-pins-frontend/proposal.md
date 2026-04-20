## Why

Backend `human.pinboards` / `human.pins` and Storage are ready with RLS and tests, but the app still uses a **non-persistent mock**: `usePinsStore` (in-memory Pinia) and `usePin()` (DOM scrape + animation) with `saveCurrentProjectPins()` as a no-op. Users need a real pinboard UX backed by Supabase, aligned with auth and project selection, plus removal of dead mock code.

## What Changes

- **Remove** `apps/web/app/stores/pins.ts`, the `usePin()` composable’s dependency on that store (replace or delete per migration below), `saveCurrentProjectPins` from `useProjectsStore` and all call sites, and any UI that only counted mock `pinnedItems.length` without replacing it with Supabase-backed counts or removing the metric.
- **Add** composable(s) loading `human.pinboards` / `human.pins` via `client.schema('human')`, wired to the active project.
- **Add** explorer/connected UI: list pins ordered by `sort_order` (+ stable tie-breaker), **group “sections” in UI only** (e.g. by `body_kind` or a small `body_kind` → label map); render `body.data` per `body_kind` registry; show `user_note`; resolve `source_document_uid` for “open in explorer” or show **source missing** + disable deep link; **chat** pins render `body.data.messages` with sender distinction (no realtime required).
- **CRUD** create / edit / delete pin; update `sort_order` (drag-and-drop or explicit controls — implementation detail). **Image pins:** prefer UX that calls a **server route** (copy to `human-pin-images` then persist pin); spec documents the secure target even if MVP is deferred or temporary.
- **i18n** for empty states, errors, source missing, section labels.
- Optional follow-up: Playwright/component smoke tests.

## Capabilities

### New Capabilities

- `human-pins-frontend`: Supabase-backed pinboard/pin UX, mock removal, resolution/degraded source, chat/image/reorder behavior, i18n.

### Modified Capabilities

- (none) — `frontend-projects-supabase` unchanged at requirement level; this change consumes projects context only.

## Impact

- `apps/web`: `stores/pins.ts` (delete), `composables/usePin.ts` (replace/remove), `stores/projects.ts`, `pages/explorer/projects.vue`, `pages/explorer/board/*`, `components/explorer/**` (Pin, DeliverableHeader, ViewModeListSimple, PublicActionBar, wf), new composables/components/routes, `i18n/locales/*.json`.
- Depends on `human-pinboards-pins`, `human-pin-storage`, `frontend-projects-supabase`; may add `server/api/*` for image copy.
