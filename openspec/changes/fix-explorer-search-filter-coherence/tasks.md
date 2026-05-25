## 1. Filter UI Scope

- [ ] 1.1 Remove Time, Phase, and Scale entries from `FilterManager.vue` metadata, active constraint signatures, and rendered filter lists.
- [ ] 1.2 Remove the Time filter import/rendering from `FilterManager.vue`; leave the standalone component untouched unless unused cleanup is safe.
- [ ] 1.3 Ensure loaded saved-search state cannot re-enable unsupported `time`, `phases`, or `scales` filters in the explorer UI.

## 2. Adaptation Approaches Filter

- [ ] 2.1 Add an Adaptation approaches filter component using the same facet/bar-chart pattern as Sector and Hazards.
- [ ] 2.2 Wire Adaptation approaches into `FilterManager.vue` active/available rendering, global facet options, and result-set counts.
- [ ] 2.3 Map active `adaptation_approaches` UI selections into `SearchFacetParams.adaptation_approaches` for explorer search requests.
- [ ] 2.4 Keep Keywords out of the explorer filter interface and request mapping.

## 3. Server-Owned Result Rendering

- [ ] 3.1 Replace `filteredPapers` client-side restriction logic in `explorer.vue` with a direct server-result derivation or neutral `visibleResults` computed value.
- [ ] 3.2 Update all explorer view-mode bindings and side-panel navigation inputs to use the server-returned result page without additional facet/time/phase/scale filtering.
- [ ] 3.3 Preserve non-restrictive display helpers such as match badges only where they annotate results without removing hits.

## 4. Tests And Documentation

- [ ] 4.1 Add or update tests that verify Adaptation approaches are sent to `/api/explorer-search` when active and omitted when inactive.
- [ ] 4.2 Add or update tests that verify unsupported filter keys (`time`, `phases`, `scales`) do not affect search requests or rendered results.
- [ ] 4.3 Add or update tests that verify visible result counts match the server-returned page hits.
- [ ] 4.4 Update `docs/explorer-search-behavior.md` to document the supported filter set and server-owned filtering model.
- [ ] 4.5 Run the relevant app test/lint checks and fix regressions introduced by the change.
## 1. Shared filter helpers

- [x] 1.1 Extract `activeKeysFromBooleanMap` to `apps/web/app/utils/explorerFilterMatch.ts` (or shared module) and use it from `listMatchBadges.ts`
- [x] 1.2 Add `deriveSearchFacetParams(effectiveFilters, enabledFilters)` and `constraintsEqual(a, b)` for constraint-diff gating

## 2. FilterManager refetch gating

- [x] 2.1 Track last-emitted active constraints in `FilterManager.vue`
- [x] 2.2 Update `handleFilterChange` / `handleFilterClear` to emit `filters-changed` only when active constraints change (enable-only updates local state only)
- [x] 2.3 Update `getEffectiveFilters` / snapshot payload so explorer receives active selections only (no all-false facet maps)

## 3. Unified search runner (explorer page)

- [x] 3.1 Implement `runExplorerSearch` in `explorer.vue`: sync `facetFilters`, text query only if search filter enabled, else `loadAll`
- [x] 3.2 Replace `handleFiltersChanged` body with constraint check + `runExplorerSearch`; update `setExplorerEffectiveFilters` to active-selection snapshot
- [x] 3.3 `provide('runExplorerSearch')` (and optional `isSearching`) for child components

## 4. SearchFilter integration

- [x] 4.1 Remove duplicate `useHybridSearch()` from `SearchFilter.vue`; call injected `runExplorerSearch` on Search / Enter / pills
- [x] 4.2 Remove `setResultsData(null)` from `handleFilterClear`; route clear through `filters-changed` / runner
- [x] 4.3 Wire `FilterManager` to forward run-search from SearchFilter when needed

## 5. Results display

- [x] 5.1 Change `filteredPapers` (or view props) to use `resultsData.hits` for API facets; keep client-only filter for phases/scales/time if present
- [x] 5.2 Verify corpus count line (`Showing X of Y`) still uses loaded hit count vs `corpusTotalCount`

## 6. Phase 1 verification

- [x] 6.1 Manual QA: enable sector panel only → no network call, list unchanged
- [x] 6.2 Manual QA: select sector → request includes `sectors`; UI count matches response
- [x] 6.3 Manual QA: Search with sector selected → query + sectors in one request
- [x] 6.4 Manual QA: search panel off + text in store + facet change → no `query` in body
- [x] 6.5 Manual QA: clear search → hits visible with open empty facet panel

## 7. Phase 2 — follow-up (deferred)

- [x] 7.1 Gate `applyAllFilters` with same constraint-diff logic
- [x] 7.2 Align `handleLoadSavedSearch` refetch: refetch when restored payload has active selections only
