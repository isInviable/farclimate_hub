## Context

The private pinboard loads rows from `human.pinboards` and `human.pins` through `usePinsSupabase.loadPinsForProject(projectId)`. That loader intentionally requires authentication and relies on owner-scoped Supabase RLS, so it clears pins for anonymous viewers and non-owner users.

The public board route (`/explorer/board/public/[id]`) currently reuses that private loader. The route, header, and read-only `PinBoardView` wiring exist, but shared viewers cannot receive pin data unless they are effectively the project owner in the current client state. Existing share behavior copies a URL containing the project UUID; that is both non-functional for public viewers and undesirable as a long-lived sharing identifier.

## Goals / Non-Goals

**Goals:**

- Make public board URLs render the same pin rows as the private board for anyone with a valid share token.
- Avoid exposing project UUIDs as public sharing identifiers.
- Let an owner create or reuse a share token by clicking **Share board**.
- Preserve read-only behavior on public boards: no pin editing, deleting, creation, selection actions, or artifact generation.
- Keep the current share UX simple: no separate "make public" toggle is required before copying a link.
- Avoid widening direct Supabase table access to `anon` clients.
- Return enough project metadata for the public header to avoid depending on the authenticated projects store.

**Non-Goals:**

- Add a permissions UI, collaborator model, expiration dates, analytics, or comments persistence.
- Implement link revocation/regeneration UI beyond what is needed for safe token persistence.
- Include saved searches on the public board.
- Implement public artifact generation, downloads, comments persistence, or clone semantics.
- Backfill, migrate, or alter existing `human.pinboards` / `human.pins` rows.

## Decisions

### Persist share tokens separately from projects

Add a `human.project_share_links` table, or an equivalently scoped human-schema table, that stores public board links:

- `id uuid primary key`
- `project_id uuid not null references human.projects(id) on delete cascade`
- `token text unique not null`
- `enabled boolean not null default true`
- `created_by uuid not null references auth.users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `revoked_at timestamptz null`

Only project owners should be able to manage share-link rows through authenticated server endpoints. Public viewers never query this table directly.

Alternative considered: keep UUID-only sharing with `/public/:projectId`. This was rejected because project UUIDs become bearer secrets and cannot be rotated independently from the project row.

### Use narrow server APIs for share creation and public reads

Add an authenticated endpoint such as `POST /api/public-board/share` that verifies the caller owns the project, creates or reuses an enabled share token, and returns the public URL path.

Add a read-only endpoint such as `GET /api/public-board/:token` that accepts the share token, resolves it to an enabled share row, and returns a shaped payload:

- project id and display name
- ordered pins for the project's single pinboard

The endpoints may use the existing server-side Supabase configuration pattern with the service role key, but only internally and only for fixed, narrow queries. The public read endpoint must validate the token first, then read the resolved project, pinboard, and pins, and return a whitelisted payload. This keeps browser clients from reading `human.pinboards`, `human.pins`, or share-link rows directly as `anon`, preserving the current RLS posture for table access.

Alternative considered: add `anon` SELECT policies on `human.pinboards` and `human.pins`. This was rejected for the minimal fix because it broadens direct database surface area and requires more careful public/private predicates.

### Generate high-entropy, non-project tokens

The public URL changes to `/explorer/board/public/:token`. The token should be high entropy, URL-safe, unique, and unrelated to the project UUID. The share endpoint should prefer reusing an existing enabled token for the project so repeated clicks copy the same link, unless a later revocation/regeneration feature is introduced.

Alternative considered: add a boolean `is_shared` column on `human.projects`. This is simpler than token persistence but still exposes project UUIDs and does not support independent link rotation later.

### Add a public loader path instead of reusing owner loader

The public page should not call `loadPinsForProject`, because that function is correctly owner/auth scoped. Add either a small public-board composable or a clearly named `loadPublicBoardByToken` branch that fetches the public read API and updates the pins state consumed by `PinBoardView`.

The public page should pass the returned project name to `PublicBoardHeader` instead of relying on `projectsStore.currentProject`, which is unavailable for anonymous and non-owner viewers.

Alternative considered: temporarily spoof `projectsStore.currentProjectId` and reuse existing watchers. This would couple public read behavior to owner-only project state and risks triggering authenticated-only saved-search and artifact loaders.

### Do not include saved searches

Saved searches are intentionally excluded from the public payload and public board UI scope. If `PinBoardView` currently fetches saved searches from the active project store, the implementation should avoid showing or fetching that section in public mode.

## Risks / Trade-offs

- [Risk] Service-role server routes could accidentally expose too much row data. → Mitigation: keep endpoints narrow, validate ownership or token first, return a whitelisted shape, and do not accept dynamic table names, select strings, or arbitrary filters.
- [Risk] Share tokens may be guessable if generated poorly. → Mitigation: generate high-entropy URL-safe tokens server-side and enforce uniqueness.
- [Risk] Repeated share clicks could create many active links. → Mitigation: create or reuse one enabled token per project for this change.
- [Risk] Public page might still trigger authenticated-only side loaders through shared components. → Mitigation: add an explicit public/read-only prop or composable state so saved searches and edit-only affordances remain disabled.
- [Risk] Empty-board messaging may hide API failures. → Mitigation: surface API errors through the existing `PinBoardView` `error` prop and keep the empty message only for successful zero-pin responses.

## Migration Plan

Add the share-link table through the existing Supabase setup/migration path, then deploy the share creation endpoint, public read endpoint, and frontend wiring together. Existing project, pinboard, and pin RLS remains unchanged for direct browser access. Rollback is a standard application rollback plus leaving the inert share-link table in place; existing private board reads and writes remain unchanged.

## Open Questions

None for the minimal fix. Share revocation UI, token regeneration UI, public saved searches, and public artifacts remain future product decisions.
