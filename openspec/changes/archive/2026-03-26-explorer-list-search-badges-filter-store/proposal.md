## Why

The explorer list view (`ViewModeListSimple`) only shows each article title, so users cannot see at a glance how a result relates to the search or active filters (e.g. sector, climate impact). Active filter state for the explorer currently lives partly in `FilterManager` (internal `filters` / `enabledFilters`) and partly as `activeFilters` in `explorer.vue`, which duplicates the emitted payload and makes it hard for distant components (like the list) to read the same truth without prop drilling.

## What Changes

- **List row layout**: Each list row SHALL reserve roughly the **last ~20%** of horizontal space for compact **match context** (tags/badges), with the title/checkbox/pin area using the remainder (~80%), using responsive flex/grid and `min-w-0` so titles truncate cleanly.
- **Search-related badges**: When the user has active facet-style constraints that the search or client-side filter pipeline applies (at minimum **sector** and **climate impacts / hazards**, and **biogeographical region** when enabled), each row SHALL show **Nuxt UI `UBadge`** (or equivalent) for values that the **document actually carries** and that **intersect** the active filter selection (so badges reflect “why this row is relevant,” not the full document taxonomy).
- **Shared filter snapshot in Pinia**: Introduce or extend a **Pinia** store so the **effective explorer UI filters** (equivalent to today’s `getEffectiveFilters()` / `activeFilters`) are the **single shared source** consumed by `explorer.vue` (for `filteredPapers`), `ViewModeListSimple` (for badges), and optionally `FilterManager` (write path). **Evaluate** extending `useSearchStore` vs a small dedicated `useExplorerFiltersStore`; pick one pattern in design. The snapshot **SHALL** use **JSON-serializable** values only and **SHALL NOT** break **saved searches** (`SavedSearchFilters`: `searchQuery`, `enabledFilters`, `filters` — save/load round-trip preserved).
- **i18n** for badge group labels or tooltips if needed (reuse existing facet strings where they exist).

## Capabilities

### New Capabilities

- `explorer-active-filters-store`: Pinia-backed snapshot of effective explorer filter UI state, kept in sync when filters change, consumed by list badge logic and explorer filtering without duplicating `reactive` copies in the page shell alone.
- `explorer-list-match-badges`: List view row layout (~80/20) and rules for which badges appear given active filters and per-hit document fields; Nuxt UI badges and accessible structure.

### Modified Capabilities

- (none — existing `explorer-facet-filters` / `hybrid-search` API contracts stay the same; this is client UI and state placement.)

## Impact

- **Code**: `apps/web/app/pages/explorer/explorer.vue`, `apps/web/app/components/explorer/wf/viewmodes/ViewModeListSimple.vue`, `apps/web/app/components/explorer/deliverable1/FilterManager.vue` (optional direct store writes), `apps/web/app/stores/search.ts` or new `stores/explorerFilters.ts`, i18n `en.json` / `es.json` as needed.
- **APIs**: None.
- **Dependencies**: Pinia (already), Nuxt UI.
