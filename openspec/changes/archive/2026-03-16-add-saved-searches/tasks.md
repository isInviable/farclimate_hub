## 1. Database Migration

- [x] 1.1 Create `packages/supabase-setup/sql/06_saved_searches.sql` with `human.saved_searches` table (id, project_id FK, name, filters jsonb, created_at, updated_at)
- [x] 1.2 Add `ON DELETE CASCADE` foreign key from `project_id` to `human.projects(id)`
- [x] 1.3 Add `updated_at` trigger (reuse pattern from `04_human_projects.sql`)
- [x] 1.4 Enable RLS and create owner-only policies (SELECT, INSERT, UPDATE, DELETE) scoped via `human.projects.owner_user_id = auth.uid()`
- [x] 1.5 Grant permissions to `authenticated` role; revoke from `anon` and `public`
- [x] 1.6 Add validation block to assert RLS and policies are correctly applied
- [x] 1.7 Run migration against local Supabase and verify table, FK, RLS, and cascade work

## 2. Types

- [x] 2.1 Create `SavedSearch` interface in `apps/web/app/types/savedSearches.ts` (id, project_id, name, filters, created_at, updated_at)
- [x] 2.2 Define `SavedSearchFilters` type for the JSONB shape (searchQuery, enabledFilters, filters)

## 3. Composable — Data Access

- [x] 3.1 Create `apps/web/app/composables/useSavedSearchesSupabase.ts` following the `useProjectsSupabase` pattern
- [x] 3.2 Implement `fetchSavedSearches(projectId)` — SELECT ordered by `updated_at DESC`
- [x] 3.3 Implement `createSavedSearch(projectId, name, filters)` — INSERT + re-fetch
- [x] 3.4 Implement `deleteSavedSearch(id)` — DELETE + re-fetch
- [x] 3.5 Add `requireAuthForPersistence()` guard to all write operations
- [x] 3.6 Wire reactive `savedSearches` ref and `loading`/`error` state

## 4. SavedSearchMenu Component

- [x] 4.1 Create `apps/web/app/components/explorer/deliverable1/SavedSearchMenu.vue`
- [x] 4.2 Add three-dot trigger button (`UButton` with `mdi:dots-vertical` icon)
- [x] 4.3 Implement `UDropdownMenu` listing saved searches for the current project
- [x] 4.4 Add "Save current search" action that opens a name-input popover/modal
- [x] 4.5 Add delete action (trailing icon) on each saved-search item
- [x] 4.6 Emit `load-search` event with deserialised filter state when a saved search is selected
- [x] 4.7 Show empty-state message when no saved searches exist
- [x] 4.8 Hide the component entirely when in demo mode (`isDemoMode`)

## 5. FilterManager Integration

- [x] 5.1 Import `SavedSearchMenu` in `FilterManager.vue`
- [x] 5.2 Place the component in the "Active Filters" header row (next to the funnel icon / heading)
- [x] 5.3 Pass current `filters`, `enabledFilters`, and `searchQuery` as props
- [x] 5.4 Handle `load-search` event — restore `filters`, `enabledFilters`, update `searchStore.searchQuery`, and emit `filters-changed`

## 6. Project-Switch Reactivity

- [x] 6.1 Watch `projectsStore.currentProjectId` in `SavedSearchMenu` and re-fetch saved searches on change
- [x] 6.2 Verify that switching projects clears and reloads the saved-searches dropdown

## 7. Expose Schema (if needed)

- [x] 7.1 Verify `05_expose_human_schema.sql` already grants the necessary schema/table access for the new table, or add grants for `human.saved_searches`
