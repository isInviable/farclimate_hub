> **Archived:** See `REMAINING.md` in this folder for follow-up tasks and optional polish.

## 0. Remove mock pin system

- [x] 0.1 Delete `apps/web/app/stores/pins.ts` and remove `usePinsStore` imports from: `usePin.ts`, `explorer/board/index.vue`, `explorer/board/public/[id].vue`, `DeliverableHeader.vue`, `explorer/ui/pin/Pin.vue`, `ViewModeListSimple.vue`, `PublicActionBar.vue`, `explorer/projects.vue` (and any other grep hits)
- [x] 0.2 Remove `saveCurrentProjectPins` from `apps/web/app/stores/projects.ts` and delete all call sites (previously invoked from pins store only after 0.1)
- [x] 0.3 Replace or remove `apps/web/app/composables/usePin.ts`: either implement Supabase `human.pins` insert from explorer context, or remove pin-from-DOM flow until insert API exists; update `Pin.vue` accordingly
- [x] 0.4 Fix `explorer/projects.vue` (and similar): replace mock `pinsStore.pinnedItems.length` / `totalPins` / “most pinned” logic with Supabase-backed counts from the new composable, or remove those stats until counts are available

## 1. Data layer

- [x] 1.1 Add composable (e.g. `usePinsSupabase`) using `client.schema('human')` for `pinboards` and `pins` (pinboard by `project_id`, pins by `pinboard_id`, order `sort_order`, tie-break `created_at` or `id`)
- [x] 1.2 Implement create / update / delete pin mutations with valid `{ v: 1, data }` and optional `source_*`, `user_note`, `body_kind`
- [x] 1.3 Wire composable to current project id from `useProjectsStore` / `useProjectsSupabase`
- [x] 1.4 Expose helpers to update `sort_order` (single or batch) for reorder UX

## 2. UI

- [x] 2.1 Pinboard surface (route or panel): load pinboard for active project; empty / loading / error states
- [x] 2.2 List pins with UI-only grouping by `body_kind` (or mapped section labels); stable sort per spec — **`PinBoardView`** + `groupPinsByBodyKind` (sections ordered by min `sort_order` per kind; pins within section by `sort_order` / `created_at`); sidebar filter All / per kind
- [x] 2.3 Renderer registry: generic fallback + `chat` (`body.data.messages` with sender/role distinction) + at least one non-chat kind (e.g. text/markdown in `data`) — **`PinBodyRenderer`**: `PinRenderChat`, `PinRenderText` (markdown/text), `PinRenderImage`, `PinRenderFallback` (JSON)
- [x] 2.4 Show `user_note`, `source_title_snapshot`; resolve `source_document_uid` for open-in-explorer; **source missing** i18n + disabled link; still show body/note — **done:** `?document=` / `?uid=` / `?document_uid=` on `/explorer/explorer` opens the side panel (hits first, else `GET /api/document-by-uid` + RPC `get_document_by_uid`); board **Open in explorer** link; **source missing** when no uid on text/document pins
- [ ] 2.5 Create / edit / delete flows (Nuxt UI); reorder via drag-and-drop or explicit controls persisting `sort_order` — **partial:** create from explorer (`Pin` / `usePin`), notes via `updatePin` on popover close, delete via unpin; **no** board-side edit modal or reorder UI yet (`reorderPins` API exists)
- [x] 2.6 Image pin: call server route that copies to user bucket then writes pin (or stub route + TODO if deferred); document intended flow in code comment referencing `human-pin-storage`

## 3. i18n & access

- [x] 3.1 `en.json` / `es.json`: empty pinboard, errors, source missing, section labels (from `body_kind` keys), chat labels if needed — **partial:** pin notes, board empty, public empty, source missing; section `body_kind` labels not fully enumerated
- [x] 3.2 Guard all Supabase pin calls with `useAccess` / auth same as projects (no pins for demo unless product adds demo projects later)

## 4. Optional

- [ ] 4.1 Playwright or component test: pin list load with mocked Supabase (optional)
- [ ] 4.2 Server route implementation for image copy + storage delete on pin delete (when prioritizing image pins)
