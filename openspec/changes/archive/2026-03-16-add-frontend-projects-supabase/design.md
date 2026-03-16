## Context

The app has a Pinia projects store that persists to localStorage and is used by the Projects Dashboard page and the explorer DeliverableHeader (current project, switch, create, rename, delete). Supabase already exposes `human.projects` with RLS so authenticated users can CRUD only their own rows. The frontend must switch to this backend while keeping the same UX and following Nuxt + Supabase best practices.

## Goals / Non-Goals

**Goals:**

- Use Supabase `human.projects` for list, create, update, and delete; use existing `useSupabaseClient` and session.
- Preserve current UX: dashboard list, current project selection, create/rename/delete from UI.
- Restrict project CRUD to authenticated users; in demo mode show empty or disabled state and sign-in prompts via `useAccess` / `requireAuthForPersistence`.
- Align frontend type with DB: `id` (uuid), `owner_user_id`, `name`, `description`, `created_at`, `updated_at`; keep `pinnedItems` in the pins store for now (no DB persistence of pins in this change).

**Non-Goals:**

- Persisting pins to the database or linking pins to projects in DB (future story).
- Changing RLS or backend schema.
- Adding new API routes; use Supabase client from the browser with RLS.

## Decisions

1. **Single composable + optional Pinia store for current project**
   - **Decision:** Introduce a `useProjects` (or `useProjectsSupabase`) composable that performs all Supabase calls (fetch list, create, update, delete). Keep a thin store or composable-owned state for `currentProjectId` so the header and dashboard can share “current project” without prop drilling.
   - **Rationale:** Nuxt best practice is composables for data + Supabase; a small amount of shared state (current project id) keeps pages and header in sync.
   - **Alternative:** Pure store that wraps Supabase — acceptable if the store is the single place that talks to Supabase and exposes reactive state.

2. **Fetch projects reactively when authenticated**
   - **Decision:** When the user is authenticated, fetch `human.projects` (e.g. via `.from('human.projects').select()`) in a way that reacts to auth and refetches after create/update/delete. Use the Supabase client from `useSupabaseClient`; optionally use `useAsyncData`/`useFetch` for SSR-safe loading on pages that need it, or client-only fetch in composable/store.
   - **Rationale:** RLS ensures the client only sees own rows; reactive refetch keeps the list correct after mutations.

3. **Demo mode: no project list from DB, prompt to sign in**
   - **Decision:** When `useAccess().isDemoMode` is true, do not call Supabase for projects; show empty list and “Sign in to manage projects” (or equivalent). All create/rename/delete actions guard with `requireAuthForPersistence()` and redirect to login when in demo mode.
   - **Rationale:** Matches existing pattern (e.g. admin) and avoids anon access; `human.projects` RLS already denies anon.

4. **Map DB columns to frontend shape**
   - **Decision:** Use `id`, `name`, `description`, `created_at`, `updated_at` from the table; treat `owner_user_id` as read-only. For the dashboard and header, expose a `Project` type that includes these; keep `pinnedItems` only in the pins store (and optionally in memory per “current project” for backward compatibility with existing pin UI) until a future pin-persistence story.
   - **Rationale:** Minimal change to backend contract; pin data stays out of scope.

5. **Current project selection persisted in localStorage only**
   - **Decision:** Persist `currentProjectId` in localStorage (or sessionStorage) so the “current project” survives reload for the same device; the project row itself lives in Supabase. If the project was deleted elsewhere, clear or fallback current selection on load.
   - **Rationale:** Avoids adding a “last_selected_project” column or user preference table in this change; keeps scope small.

## Risks / Trade-offs

- **[Stale current project]** User selects a project, then deletes it in another tab; current selection may point to missing project. → **Mitigation:** On load, if `currentProjectId` is set, verify project exists in fetched list; if not, clear it or set to first project.
- **[SSR]** Fetching projects in layout/header may run on server without a session. → **Mitigation:** Fetch projects only on client, or use `useAsyncData` with a key that includes auth so server returns empty and client refetches when hydrated with session.
- **[Pins not tied to DB project yet]** Switching “current project” still only swaps in-memory pins; pins are not stored per project in DB. → **Mitigation:** Document as known limitation; future story can add pin–project association and persistence.

## Migration Plan

1. Add composable (and optionally refactor store) to use Supabase for projects; guard all mutations with auth check.
2. Update Projects Dashboard page to use the new data layer and show demo state when not authenticated.
3. Update DeliverableHeader to use the new data layer for current project, list in dropdown, create/switch/rename.
4. Remove localStorage persistence of project list (keep only currentProjectId if desired).
5. Test: authenticated user can list/create/rename/delete; demo user sees empty state and is redirected to login on create; after login, list reflects Supabase data.

## Open Questions

- Prefer a single `useProjects` composable that owns both Supabase calls and current-project state, or keep the store and inject Supabase inside the store?
- Should the Projects Dashboard page be server-rendered with an empty list and then client-hydrate with real list, or fully client-fetched?
