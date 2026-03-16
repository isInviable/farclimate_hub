## Why

Users can now create projects and persist them in the database, but their exploration work (filter selections, search terms) is lost every time they navigate away. Saving searches within a project lets users bookmark specific filter+query combinations, quickly resume previous explorations, and share curated search states via their project's public board.

## What Changes

- **New `human.saved_searches` table** — stores serialised search state (JSONB) linked to a project, with a user-given name. RLS ensures owner-only access.
- **Saved-search CRUD composable** — `useSavedSearchesSupabase` encapsulates fetch/create/update/delete operations against the new table.
- **`SavedSearchMenu` component** — a three-dot dropdown placed next to the "Active Filters" heading in `FilterManager`. Lists existing saved searches for the current project, allows loading one (restoring filters + query), saving the current state as a new search, and deleting existing ones.
- **Search-state serialisation** — a utility that captures the current filter and search-query state into a single JSONB-compatible object and can restore it.

## Capabilities

### New Capabilities
- `saved-searches`: Persist, load, and delete named search states (filters + query) within a project, backed by a Supabase table with RLS.

### Modified Capabilities
_(none — the existing `human-projects` and `frontend-projects-supabase` specs are unchanged; the new table simply references `human.projects`.)_

## Impact

- **Database** — new migration SQL file (`06_saved_searches.sql`) adding `human.saved_searches` table with foreign key to `human.projects`, RLS policies, and indexes.
- **Frontend composable** — new `useSavedSearchesSupabase.ts` in `apps/web/app/composables/`.
- **Frontend component** — new `SavedSearchMenu.vue` in `apps/web/app/components/explorer/deliverable1/`.
- **FilterManager.vue** — minor template change to slot the `SavedSearchMenu` next to the "Active Filters" heading.
- **Types** — new `SavedSearch` interface in `apps/web/app/types/`.
- **No breaking changes** — additive only; existing search and filter flows are unaffected.
