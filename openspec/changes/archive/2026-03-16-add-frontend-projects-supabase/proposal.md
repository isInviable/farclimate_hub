## Why

The backend already provides `human.projects` in Supabase with owner-scoped RLS. The frontend still uses a Pinia store backed by localStorage, so project data is device-bound and not available to authenticated users across sessions or devices. Switching to Supabase for create and retrieve aligns the UI with the existing database and enables real persistence for signed-in users.

## What Changes

- Replace localStorage-backed project persistence with Supabase `human.projects` for list, create, update, and delete.
- Refactor the projects store (or replace it with a composable) so it uses the Supabase client and respects auth: only authenticated users perform CRUD; demo users keep a read-only or empty view with clear sign-in prompts.
- Align the frontend `Project` type with the database shape (`id`, `owner_user_id`, `name`, `description`, `created_at`, `updated_at`); keep or adapt `pinnedItems` locally or in a separate future story.
- Update `pages/explorer/projects.vue` and `DeliverableHeader.vue` to use the new data layer without changing the current UX goals (dashboard, create, switch, rename, delete).
- Follow Nuxt + Supabase best practices: use existing `useSupabaseClient` and `useAccess`, reactive queries where appropriate, and guard persistence with `requireAuthForPersistence` for demo users.

## Capabilities

### New Capabilities

- `frontend-projects-supabase`: Web app project CRUD and current-project state using Supabase `human.projects` and authenticated session, with demo-mode handling.

### Modified Capabilities

- (none)

## Impact

- **Affected code:** `apps/web/app/stores/projects.ts`, `apps/web/app/pages/explorer/projects.vue`, `apps/web/app/components/explorer/deliverable1/DeliverableHeader.vue`; possible new composable(s) for Supabase project access.
- **Auth:** Project list/create/update/delete require authenticated session; demo users see empty or disabled state and sign-in prompts.
- **Pins:** Pinned items can remain in the existing pins store and local state for this change; linking pins to projects in the DB is out of scope unless explicitly included.
