## Why

The explorer filter UI still contains leftovers from earlier client-side filtering work: unsupported Time, Phase, and Scale filter concepts, plus a client-side result filter that can disagree with server totals, facets, and pagination. The current server-backed explorer search should be the single source of truth so visible results, counts, facets, and page navigation stay coherent.

## What Changes

- Remove the Time filter from the explorer filter interface because it is not a facet and should not be mixed into the current facet filter model.
- Remove unsupported Phase and Scale filter leftovers from filter metadata, signatures, saved/filter state handling where they only support dead client-side paths.
- Add an Adaptation approaches facet filter to the explorer interface, backed by existing `adaptation_approaches` facet data and search API parameters.
- Keep Keywords hidden from the filter interface because it is a wider taxonomy and not part of this UX scope.
- Remove client-side result restriction from `filteredPapers`/equivalent explorer result derivation so the explorer renders the server-returned page directly.
- Ensure active explorer filters sent to the server are limited to supported server-backed filters: search query, sectors, climate impacts, adaptation approaches, and biogeographical regions.
- Update explorer search behavior documentation to reflect the supported filter set and server-owned filtering model.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `explorer-facet-filters`: The explorer filter UI supports Adaptation approaches and no longer exposes unsupported Time, Phase, or Scale filters.
- `explorer-search-pagination`: Visible explorer results, totals, facet counts, and pagination are all derived from the server-backed search result set without an additional client-side restriction pass.
- `search-api`: Explorer-facing search requests include supported facet filters only, with Adaptation approaches included and Keywords intentionally not exposed by the UI.

## Impact

- Affected frontend components: `FilterManager.vue`, facet filter components under `apps/web/app/components/explorer/deliverable1`, and `apps/web/app/pages/explorer/explorer.vue`.
- Affected search mapping: `useHybridSearch`, `SearchFacetParams`, and the explorer filter-to-facet request mapping.
- Affected docs/tests: explorer search behavior documentation and focused tests for adaptation approach request mapping, unsupported filter removal, and direct rendering of server-returned results.
- No database migration is expected because `adaptation_approaches` already exists in `knowledge.summary`, facet RPCs, and search filtering.
## Why

The deliverable-1 explorer search UI can return hits from `POST /api/search` while the result list shows zero rows. Root causes are duplicate filtering (client-side `filteredPapers` treats an enabled-but-empty facet map as “match nothing”) and incoherent refetch rules (enabling a filter panel triggers search; text in the store is sent even when the search panel is off; sidebar Search uses a separate `useHybridSearch` instance without facet params). Users lose trust in filters and see confusing network vs UI behavior.

## What Changes

**Phase 1 (this change)**

- Gate explorer refetch: enabling a facet panel alone does **not** call `/api/search` or change results; refetch runs when facet **selections** change (or when constraints are removed).
- Tie free-text query to the **enabled** search filter: `searchStore.searchQuery` is only sent when the search panel is active; facet-only refetches use `loadAll` + facet params.
- Single facet-aware search runner: one code path (`runExplorerSearch`) used by `handleFiltersChanged`, Search button, Enter, and pills — no second `useHybridSearch()` in `SearchFilter`.
- Display coherence: view modes show API hits for server-filtered facets (`sector`, `hazards`, `biogeographical_regions`); remove or guard client-side re-filtering that hides valid hits.
- Clear search: stop nulling `resultsData` before refetch; rely on shared runner + loading state.

**Phase 2 (follow-up, out of scope for initial tasks)**

- Align **Apply filters** with the same constraint-diff gate.
- Align **saved-search load** refetch rules with manual filter behavior.

No backend or `POST /api/search` contract changes.

## Capabilities

### New Capabilities

- `explorer-search-execution`: Unified explorer search orchestration (text + facets), when refetch runs, and how query text is included.

### Modified Capabilities

- `explorer-facet-filters`: Distinguish panel enabled vs active selection; refetch only on selection changes; text query only when search filter enabled.
- `explorer-active-filters-store`: Snapshot and badges use **active selections** only, not all-false maps from enable-only toggles.
- `explorer-results-view-controls`: Filtered result list for viewmodes reflects API hits for server-applied facets (no second pass that hides all rows).

## Impact

- **Frontend**: `apps/web/app/pages/explorer/explorer.vue`, `FilterManager.vue`, `FilterComponent.vue`, `SearchFilter.vue`, `BarChartFilter.vue`, `useHybridSearch.ts` (or new `useExplorerSearch.ts`), `listMatchBadges.ts`, optional `explorerFilterMatch.ts`.
- **Specs**: Deltas under this change; archive merges into `openspec/specs/`.
- **Risk**: Low–medium; behavior change for enable-toggle and sidebar Search+facets combination. Manual verification checklist in tasks.
