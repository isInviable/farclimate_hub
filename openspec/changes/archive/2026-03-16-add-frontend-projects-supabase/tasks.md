## 1. Data layer and types

- [x] 1.1 Define a `Project` type (or interface) aligned with `human.projects`: `id`, `owner_user_id`, `name`, `description`, `created_at`, `updated_at`; export from a shared types file or composable.
- [x] 1.2 Add a composable `useProjectsSupabase` (or `useProjects`) that uses `useSupabaseClient` and `useAccess`: fetch list from `human.projects` when authenticated, expose reactive list and loading/error state; guard create/update/delete with auth and call `requireAuthForPersistence` for demo users.
- [x] 1.3 In the composable, implement create (insert), update (rename), delete, and list (select); ensure RLS is used (no server API route). Optionally persist `currentProjectId` in localStorage and validate it against the fetched list on load.

## 2. Store refactor

- [x] 2.1 Refactor `stores/projects.ts` to use the new composable (or move logic into the composable and keep the store as a thin wrapper that exposes `currentProjectId`, `currentProject`, and actions that delegate to Supabase). Remove localStorage persistence of the project list.
- [x] 2.2 Expose the same API surface used by the dashboard and header: `projects`, `currentProjectId`, `currentProject`, `createProject`, `switchToProject`, `updateProjectName`, `deleteProject`, `initialize` (or equivalent), and `recentProjects` if still needed; ensure “current project” is validated against the Supabase-backed list.

## 3. Projects Dashboard page

- [x] 3.1 Update `pages/explorer/projects.vue` to use the Supabase-backed store/composable; when not authenticated show empty state with sign-in prompt and do not fetch from Supabase.
- [x] 3.2 Wire create, rename, delete, and switch-to-project to the new data layer; keep existing UI structure (cards, modal, dropdown actions) and ensure list refreshes after mutations.

## 4. DeliverableHeader

- [x] 4.1 Update `components/explorer/deliverable1/DeliverableHeader.vue` to use the Supabase-backed store/composable for current project name, dropdown list, create, switch, and rename; guard create/rename with auth.
- [x] 4.2 Ensure header shows “Sign in” / demo state when not authenticated and does not call Supabase for project list.

## 5. Demo mode and cleanup

- [x] 5.1 Ensure all project create/update/delete paths call `requireAuthForPersistence` (or equivalent) and redirect demo users to login with return path.
- [x] 5.2 Remove any remaining localStorage save/load of project list; keep only `currentProjectId` in localStorage if designed so. Verify no references to old project list persistence.
