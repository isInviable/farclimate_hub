## Why

Public board links currently route to `/explorer/board/public/:id`, but shared viewers do not see the board's pins because the page reuses the authenticated owner-only Supabase loader. The fix should restore "anyone with the link can view" sharing without exposing project UUIDs as bearer secrets or loosening direct browser access to `human` tables.

## What Changes

- Add token-backed public board sharing: clicking **Share board** creates or reuses an enabled share token and copies `/explorer/board/public/:token`.
- Add a public, read-only board data path for `/explorer/board/public/:token` that validates the token server-side and returns the shared project's pins ordered the same way as the private board.
- Allow anonymous users, logged-in non-owners, and the owner to view pins through a valid public share token.
- Keep the public board read-only: no pin create, update, delete, selection, artifact generation, or saved-search management.
- Exclude saved searches from the public board for this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `human-pinboards-pins`: Add project pinboard share-link persistence for token-backed public board access.
- `human-pins-frontend`: Public shared pinboards shall load and render pins for anyone with a valid public share token, while preserving owner-only edit capabilities on the private board.

## Impact

- Affected database/bootstrap: add a share-link table or equivalent persistence for project public board tokens, with owner-only management access.
- Affected frontend: share button flow, `apps/web/app/pages/explorer/board/public/[id].vue`, public board header state, and pin loading/composable code.
- Affected server API: add an authenticated share-token creation/reuse endpoint and a read-only public board endpoint that resolves tokens before reading project metadata, pinboard, and pins.
- Affected tests: add focused server and/or page-level tests for public pin loading and read-only behavior.
- A database migration/bootstrap update is expected for share-link persistence, but existing project, pinboard, and pin RLS for direct browser access should remain unchanged.
