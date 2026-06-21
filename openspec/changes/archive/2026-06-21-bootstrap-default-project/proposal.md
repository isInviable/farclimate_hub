## Why

New users receive a `human.profiles` row on signup but no `human.projects` row. Pinning and other persistence features require an active project, so new users hit a silent failure (`usePin` returns null) and see a generic save error. Every user should have at least one transparent workspace; users who do not care about project management should still be able to pin immediately after signup.

## What Changes

- Extend `human.bootstrap_profile_from_auth_user()` to insert a default project (`"Default project"`) for each new `auth.users` row. The existing pinboard `AFTER INSERT` trigger on `human.projects` continues to create the pinboard automatically.
- Add a `BEFORE DELETE` trigger on `human.projects` that rejects deletion when it would leave the owner with zero projects.
- Update `packages/supabase-setup/sql/03_human_profiles.sql` for greenfield bootstrap parity and add an incremental SQL file (`10_human_default_project.sql`) for existing deployed environments.
- **No backfill** for existing users without projects; those few accounts will be handled manually (users create a project themselves).
- **Nice-to-have (not blocking):** show a friendly, localized error in the frontend when delete is rejected because it is the user's last project.

## Capabilities

### New Capabilities

_None — behavior extends existing human-domain project and profile capabilities._

### Modified Capabilities

- `human-profiles`: profile bootstrap SHALL also provision the user's first default project on auth user creation.
- `human-projects`: users SHALL always retain at least one owned project; deleting the last project SHALL be rejected at the database layer.
- `frontend-projects-supabase`: project delete flow SHOULD surface a user-friendly message when the database rejects last-project deletion.

## Impact

- **Database:** `packages/supabase-setup/sql/03_human_profiles.sql`, new `packages/supabase-setup/sql/10_human_default_project.sql` (function replace + delete guard only; no data backfill).
- **Frontend (optional polish):** `useProjectsSupabase.ts`, `projects.vue`, i18n strings for last-project delete error.
- **Unchanged:** pinboard/pins schema, RLS policies, `projectsStore.initialize()` three-tier current-project resolution (tier 3 already selects the first project once one exists).
- **Manual ops:** existing users without a project must create one manually; no automated migration.
