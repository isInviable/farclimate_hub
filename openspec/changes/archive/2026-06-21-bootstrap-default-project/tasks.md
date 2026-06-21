## 1. Database — bootstrap default project

- [x] 1.1 Extend `human.bootstrap_profile_from_auth_user()` in `packages/supabase-setup/sql/03_human_profiles.sql` to insert one `human.projects` row (`owner_user_id = new.id`, `name = 'Default project'`) after the profile insert
- [x] 1.2 Add `packages/supabase-setup/sql/10_human_default_project.sql` with `CREATE OR REPLACE` for the updated bootstrap function (no backfill INSERT)
- [x] 1.3 Update `packages/supabase-setup/README.md` to document default project provisioning on signup and the new SQL step

## 2. Database — last-project delete guard

- [x] 2.1 Add `human.prevent_delete_last_project()` (`BEFORE DELETE` on `human.projects`) to `10_human_default_project.sql`, raising when the owner would have zero projects remaining
- [x] 2.2 Use a stable exception message or SQLSTATE prefix so the frontend can detect last-project rejection

## 3. Deploy to existing environment

- [x] 3.1 Run `10_human_default_project.sql` against staging/prod `DATABASE_URL` before demo
- [x] 3.2 Manually notify legacy users without a project to create one via the Projects dashboard (no automated backfill)

## 4. Frontend — friendly last-project delete error (nice-to-have)

- [x] 4.1 Add i18n key `projects.errors.cannotDeleteLast` (and locale variants as needed)
- [x] 4.2 Map Supabase delete rejection in `useProjectsSupabase.deleteProject()` to the localized error when the DB guard fires
- [x] 4.3 Surface the error in `projects.vue` delete flow (alert, toast, or inline message) instead of a silent failure

## 5. Verification

- [x] 5.1 Sign up a new test user → confirm exactly one project named `"Default project"` and one pinboard exist
- [x] 5.2 Pin an item as the new user → confirm pin succeeds without manual project creation
- [x] 5.3 Attempt to delete the only project → confirm database rejection and friendly UI message (when task 4 is done)
- [x] 5.4 Create a second project, delete one → confirm delete still succeeds
