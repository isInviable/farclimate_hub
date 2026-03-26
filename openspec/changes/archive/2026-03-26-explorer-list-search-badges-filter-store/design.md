## Context

`FilterManager` owns `filters` + `enabledFilters` and emits `filters-changed` with **effective** entries only (`getEffectiveFilters()`). `explorer.vue` copies that into `activeFilters` and uses it for `filteredPapers`; `ViewModeListSimple` does not receive filter state and only renders the title. `useHybridSearch` holds `facetFilters` for POST `/api/search` (sectors, `climate_impacts`, etc.) — related but not identical to UI object maps (`sector`, `hazards` booleans per key).

## Goals / Non-Goals

**Goals:**

- One Pinia-backed **snapshot** of effective UI filters that list rows and explorer filtering both use.
- List rows show **badges** for active dimensions when the hit’s document **matches** selected values (sector, hazards/climate impacts, biogeographical region when present on document + filter).
- Layout ~**80% / 20%** with truncation and wrap for badges on small screens.
- Nuxt UI (`UBadge`, layout primitives) per project standards.

**Non-Goals:**

- Redesigning the entire filter sidebar or changing search API schemas.
- Showing every document tag regardless of active filters (avoid noise).
- Server-side badge rendering.

## Decisions

1. **Store placement**  
   - **Preferred**: extend **`useSearchStore`** with `explorerEffectiveFilters: Ref<Record<string, unknown>>` (or a narrow typed interface) plus `setExplorerEffectiveFilters(payload)`. Rationale: search hub already holds `searchQuery`, `resultsData`, `selectedTags`; explorer filtering is tightly coupled.  
   - **Alternative**: new `useExplorerFiltersStore` if the team wants strict separation — acceptable; design tasks pick one and document the type in `types/` or inline.

2. **Who writes the store**  
   - **Minimal change**: `explorer.vue` `handleFiltersChanged` calls `searchStore.setExplorerEffectiveFilters(filters)` and removes local `activeFilters` reactive; `filteredPapers` reads from the store.  
   - **Optional follow-up**: `FilterManager` calls the store directly on emit to drop the parent relay — only if it reduces bugs; keep emit for backward compatibility if other parents exist.

3. **Badge source of truth for “active sector / impact”**  
   - Derive **selected keys** from the store snapshot: `sector` and `hazards` objects → keys where value is truthy; `biogeographical_regions` object or array per current shape.  
   - For each hit, map document fields: `sectors` (string | string[]), `climate_impacts[]`, geographic / bioregion fields as already used elsewhere in explorer.  
   - Badge label: human-readable value (i18n key or facet label if available); fallback to raw string.

4. **Layout**  
   - Row container: `flex flex-row gap-3 items-start` with **left** `min-w-0 flex-1` (~80%) and **right** `shrink-0 w-full sm:w-[20%] sm:max-w-xs` (approximate 20% on `sm+`, full width stack on mobile) or `basis-[20%]` with `flex-grow` on title — tune in implementation for visual balance.

5. **Overflow**  
   - Badges `flex flex-wrap gap-1 justify-end` (desktop); cap count optional (e.g. `+N`) if more than 4 matches.

## Risks / Trade-offs

- **[Risk]** UI filter shape drifts from `facetFilters` → **Mitigation**: document mapping in one helper (`getActiveFacetKeysFromExplorerFilters()`).
- **[Risk]** Documents missing fields → fewer badges; **Mitigation** acceptable; no fake badges.
- **[Risk]** `useSearchStore` grows — **Mitigation**: extract composable `useExplorerFilterSnapshot()` if needed.

## Migration Plan

- Ship incrementally: store snapshot first, then list UI; no DB migration.
- **Saved searches**: load path MUST emit / sync so the Pinia snapshot matches effective filters after `handleLoadSavedSearch`. Store payloads MUST remain JSON-serializable so `SavedSearchFilters` persistence does not regress.

## Open Questions

- Whether **phases** / **scales** / **time** filters should also emit badges in v1 (proposal: **v1** sector + hazards + biogeographical; others **stretch** if trivial).
