## 1. Share Link Persistence

- [x] 1.1 Add a Supabase setup/migration step for `human.project_share_links` (or equivalent) with `project_id`, unique high-entropy `token`, `enabled`, timestamps, `created_by`, and optional `revoked_at`.
- [x] 1.2 Add constraints and indexes for token lookup, project lookup, uniqueness, and project cascade deletion.
- [x] 1.3 Add owner-only RLS/grants or keep the table unexposed so browser clients cannot directly manage share links.
- [x] 1.4 Update setup documentation and validation tests to include share-link persistence while preserving anon denial on `human.projects`, `human.pinboards`, and `human.pins`.

## 2. Share Creation API

- [x] 2.1 Add an authenticated `POST /api/public-board/share` endpoint that accepts a project id and verifies the caller owns that project.
- [x] 2.2 Generate a URL-safe high-entropy token server-side when no enabled share link exists for the project.
- [x] 2.3 Reuse an existing enabled share token for repeated Share board clicks on the same project.
- [x] 2.4 Return the public board path `/explorer/board/public/:token` without exposing the project UUID as the route identifier.

## 3. Public Board API and Loader

- [x] 3.1 Add a read-only `GET /api/public-board/:token` server endpoint that validates the share token and returns `404` or `403` for missing, disabled, or revoked shares.
- [x] 3.2 After token validation, query the resolved project, its pinboard, and ordered pins using narrow fixed server-side queries.
- [x] 3.3 Shape the public response to include only project metadata needed by the public header and pin fields needed by `PinBoardView`; exclude owner identifiers, saved searches, artifacts, and share-link internals.
- [x] 3.4 Add a public board loader/composable path that fetches the token-based public board API and exposes `pins`, `loading`, `error`, and project title state to the public page.
- [x] 3.5 Keep the existing authenticated `loadPinsForProject` path unchanged for private owner board reads and writes.
- [x] 3.6 Ensure public loading clears stale pin state when the route token changes or the public API returns an error.

## 4. Public Board Page Wiring

- [x] 4.1 Update the Share board button flow to call the share creation API and copy the returned token URL.
- [x] 4.2 Update `apps/web/app/pages/explorer/board/public/[id].vue` to treat the route parameter as a token and call the public loader instead of `loadPinsForProject`.
- [x] 4.3 Pass the public project title into `PublicBoardHeader` so anonymous and non-owner viewers see the correct board name.
- [x] 4.4 Preserve read-only rendering by keeping selection disabled and avoiding private project-store switching for public viewers.
- [x] 4.5 Prevent saved searches from being fetched or displayed on the public board.

## 5. Verification and Tests

- [x] 5.1 Add focused tests for share-token creation/reuse, owner authorization, non-owner denial, and token uniqueness/shape.
- [x] 5.2 Add focused tests for the public board API response shape, ordered pins, zero-pin board behavior, invalid token handling, and disabled/revoked share handling.
- [x] 5.3 Add or update frontend tests/manual verification notes confirming anonymous, non-owner, and owner viewers can open `/explorer/board/public/:token` and see pins read-only.
- [x] 5.4 Run the relevant Supabase, server, lint, and type checks for changed migration/setup, server, composable, and Vue files.
- [x] 5.5 Manually verify the Share board button generates a token URL without a separate make-public toggle and without placing the project UUID in the route.
