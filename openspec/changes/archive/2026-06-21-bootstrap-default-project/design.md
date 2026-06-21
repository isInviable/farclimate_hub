## Context

Signup currently runs `human.bootstrap_profile_from_auth_user()` on `auth.users` INSERT, creating `human.profiles` only. Projects are created explicitly by the user via the frontend. Pinning (`usePin` → `projectsStore.currentProject`) fails when no project exists. The pinboard is auto-created by an existing `AFTER INSERT` trigger on `human.projects` (`human.ensure_pinboard_for_project`).

`projectsStore.initialize()` already resolves the active project via localStorage → profile `lastProjectId` → most recently updated project. Once a default project exists, tier 3 makes it active transparently on first explorer load.

## Goals / Non-Goals

**Goals:**

- Every **new** auth user gets exactly one default project named `"Default project"` at signup, with pinboard created by existing trigger.
- Users cannot delete their last owned project; enforcement at the database layer.
- Greenfield bootstrap (`03_human_profiles.sql`) and incremental deploy (`10_human_default_project.sql`) stay in sync.
- Frontend shows a friendly, localized error when last-project delete is rejected (nice-to-have, not blocking demo).

**Non-Goals:**

- Backfilling existing users who have zero projects (manual workaround: create a project in the UI).
- Localizing the DB-stored default project name (stored as English `"Default project"`; users can rename).
- Preventing users from renaming or hiding the default project in the UI.
- App-side lazy project creation (`usePin` auto-create) — database bootstrap is the single source of truth for new users.
- Changing pinboard, pins, or RLS policy structure.

## Decisions

### 1. Extend existing bootstrap function rather than a second auth trigger

**Choice:** Add project `INSERT` inside `human.bootstrap_profile_from_auth_user()` after the profile insert.

**Rationale:** One trigger on `auth.users`, same `security definer` pattern, atomic profile + project creation. A separate trigger would work but adds ordering ambiguity.

**Alternative considered:** New `human.bootstrap_default_project_from_auth_user()` + second trigger — rejected as unnecessary complexity.

### 2. Default project name is a fixed SQL literal

**Choice:** `name = 'Default project'`.

**Rationale:** Simple, demo-ready, matches product language. App already displays `human.projects.name` and supports rename.

**Alternative considered:** Empty name + app i18n fallback — rejected because DB row would look broken in raw queries and exports.

### 3. Last-project delete guard via `BEFORE DELETE` trigger

**Choice:** `human.prevent_delete_last_project()` raises an exception with a stable SQLSTATE / message prefix when `count(*) = 1` for `owner_user_id`.

**Rationale:** Authoritative regardless of client; protects against direct API calls and future UI paths.

**Alternative considered:** App-only pre-check — insufficient alone; may be added for UX alongside DB guard.

### 4. Incremental SQL file without backfill

**Choice:** `10_human_default_project.sql` contains `CREATE OR REPLACE` on bootstrap function + delete guard trigger. No `INSERT … SELECT` backfill.

**Rationale:** Only a couple of legacy accounts; manual project creation is acceptable before demo.

### 5. Friendly delete error (frontend)

**Choice:** Detect Supabase/Postgres rejection in `useProjectsSupabase.deleteProject()` and set `error` to an i18n key (e.g. `projects.errors.cannotDeleteLast`). Surface in `projects.vue` confirm flow or toast.

**Rationale:** Raw Postgres exception text is poor UX; detection via message substring or error code is sufficient for one known case.

**Priority:** Nice-to-have — demo can ship with DB rejection only.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Legacy users still have zero projects | Communicate manually; out of scope for this change |
| `initialize()` race before first fetch completes | Rare; tier 3 resolves once projects load; no extra app logic required for new users |
| User deletes all but one, then tries to delete last | DB trigger blocks; frontend shows friendly message when implemented |
| Bootstrap function change not applied to prod | Run `10_human_default_project.sql` on deployed DB before demo |
| Default project name not localized | Users can rename; acceptable for beta |

## Migration Plan

1. Update `03_human_profiles.sql` with extended bootstrap function (greenfield).
2. Add `10_human_default_project.sql` with same function body + delete guard (existing envs).
3. Run `10_human_default_project.sql` against staging/prod `DATABASE_URL` (SQL editor or targeted runner).
4. Verify: new test signup → 1 project + 1 pinboard → pin succeeds.
5. Verify: delete only project → DB error.
6. Optionally deploy frontend friendly-error handling.

**Rollback:** `CREATE OR REPLACE` bootstrap function to prior version (profile-only); `DROP TRIGGER` + `DROP FUNCTION` for delete guard. Projects already created by bootstrap remain (no harm).

## Open Questions

_None — scope confirmed: no backfill, friendly delete error is optional polish._
