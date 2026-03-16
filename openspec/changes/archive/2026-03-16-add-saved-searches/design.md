## Context

Users can create and manage projects stored in `human.projects` (Supabase). The explorer page (`explorer.vue`) combines a `FilterManager` sidebar with a search store to let users filter/search climate-adaptation case studies. Currently the full filter + search-query state lives only in component-local reactive variables and is lost on navigation. This design adds a persistence layer so that named search states can be saved within a project and quickly restored.

Key existing pieces:
- **`FilterManager.vue`** — manages `enabledFilters` (Record<string, boolean>) and `filters` (Record<string, any>) reactively; emits `filters-changed`.
- **`useSearchStore`** — holds `searchQuery`, `selectedTags`, and result data.
- **`useProjectsSupabase.ts` / `useProjectsStore`** — CRUD for `human.projects` via Supabase client with `human` schema.
- **`useAccess`** — demo-vs-authenticated gating, `requireAuthForPersistence()` guard.

## Goals / Non-Goals

**Goals:**
- Let authenticated users save the current explorer filter + query state under a name, scoped to the active project.
- List, load, and delete saved searches from a compact UI element in the filter sidebar.
- Store search state as a JSONB column so the shape can evolve without migrations.
- Follow the same Supabase CRUD + RLS pattern already established by `human.projects`.

**Non-Goals:**
- Sharing saved searches across users or projects (future).
- Auto-saving / versioning search states.
- Saving view-mode or sort preferences (separate concern).
- Server-side search execution triggered by loading a saved search (the client simply restores the state and the existing search flow runs).

## Decisions

### D1 — Separate table vs. JSONB array on `projects`
**Choice:** New `human.saved_searches` table with FK to `projects.id`.
**Rationale:** A dedicated table gives each saved search its own row, enabling individual RLS policies, independent timestamps, and clean pagination. A JSONB array on `projects` would require read-modify-write for every change and make RLS for individual entries impossible.
**Alternative considered:** JSONB array column on `human.projects` — rejected for the reasons above.

### D2 — Search-state shape stored as `jsonb`
**Choice:** A single `filters` column of type `jsonb` containing `{ searchQuery, enabledFilters, filters }`.
**Rationale:** Keeps the schema migration-free as new filter types are added. The client serialises exactly the reactive objects that `FilterManager` + `useSearchStore` already maintain.
**Shape example:**
```json
{
  "searchQuery": "drought",
  "enabledFilters": { "search": true, "sector": true, "hazards": false },
  "filters": {
    "search": "drought",
    "sector": { "agriculture": true, "water": true }
  }
}
```

### D3 — UI placement: three-dot menu next to "Active Filters"
**Choice:** A `UDropdownMenu` triggered by a `UButton` with `mdi:dots-vertical` icon, placed in the existing "Active Filters" header row inside `FilterManager.vue`.
**Rationale:** Non-intrusive; reuses Nuxt UI dropdown pattern already present in `DeliverableHeader`. The menu lists saved searches for the current project, a divider, and a "Save current search" action. Delete is exposed via a trailing icon on each item.

### D4 — Composable architecture
**Choice:** New `useSavedSearchesSupabase()` composable following the same pattern as `useProjectsSupabase()` — exposes `savedSearches` ref, `fetchSavedSearches(projectId)`, `createSavedSearch(...)`, `deleteSavedSearch(id)`.
**Rationale:** Consistent with existing data-access composables; keeps DB logic out of components.

### D5 — Auth gating
**Choice:** Reuse `requireAuthForPersistence()` from `useAccess`. The `SavedSearchMenu` component is hidden entirely in demo mode; CRUD methods bail out early via the guard.
**Rationale:** Same pattern as projects — no new auth surface.

## Risks / Trade-offs

- **[State-shape drift]** → If `FilterManager` adds new filter types, old saved searches may lack them. Mitigation: on load, missing keys default to "disabled"; the UI always shows current available filters — a saved search is additive restoration, not a complete lock.
- **[Large JSONB payloads]** → A search state is ~1–2 KB at most. No risk of hitting Supabase column limits.
- **[Cascade delete]** → `ON DELETE CASCADE` from `projects(id)` means deleting a project removes its saved searches automatically — desired behaviour, no orphans.
- **[No undo on delete]** → Deleting a saved search is permanent. Acceptable for MVP; soft-delete can be added later if needed.
