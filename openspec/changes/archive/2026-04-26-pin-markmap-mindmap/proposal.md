## Why

Users can explore article knowledge as an interactive mind map in `MarkmapViewer`, but there is no way to save that view to the project pinboard alongside other pins (text, grid compare, chat, etc.). Pinning the underlying structure (YAML front matter + markdown, or the derived markmap JSON tree) lets users bookmark the exact cognitive map they were looking at and reopen it from the board.

## What Changes

- Add a **pin from mind map** action on the explorer surface that hosts `MarkmapViewer` (same patterns as other capturable pins: auth, `source_document_uid`, `source_title_snapshot`).
- Persist a new or extended `body_kind` (e.g. `markmap` / `mindmap`) whose `body.data` stores enough to rehydrate the map (markdown + optional YAML, or serialized tree if we standardize on JSON).
- Extend the pinboard registry so list/detail views render this pin type (preview + “open in context” where applicable).
- No change to Supabase schema if `body_kind` remains a string column and `body` is JSONB; only client types and RLS-safe insert paths.

## Capabilities

### New Capabilities

- _(none — behavior is an extension of existing pin UX.)_

### Modified Capabilities

- `human-pins-frontend`: New pin `body_kind` for markmap/mind map content; requirement to create pins from the mind map viewer with document context; requirement to render the new kind on the pinboard without breaking unknown kinds.

## Impact

- `apps/web/app/components/explorer/MarkmapViewer.client.vue` (emit pin payload or expose serializable state).
- Parent explorer components that embed the markmap (wire “Pin” control + `usePinsSupabase` or existing capturable-pin composables).
- `apps/web/app/types/pins.ts` and `apps/web/app/composables/usePinsSupabase.ts` (`mapBodyKindToBoardType`, `boardDataFromPin`).
- Pin board list/card components that branch on `body_kind` (align with existing capturable block patterns).
