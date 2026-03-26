## Why

Explorer result views (`ViewModeListSimple`, `ViewModeGrid`, and siblings) expose inconsistent controls: list mode lacks select-all / unselect-all, sorting is not wired, and grid mode shows disabled pagination stubs—so users cannot page through large filtered sets or manage selection efficiently. Standardizing toolbar behavior and fixing pagination removes this friction and keeps compare / selection flows predictable across views.

## What Changes

- Introduce shared explorer UI building blocks (composable and/or small components) for **pagination**, **sort controls**, and **bulk selection** (select all / unselect all on the **currently visible page** or documented scope), built with **Nuxt UI** (`UButton`, `USelect` / `USelectMenu`, `UPagination` or equivalent per Nuxt UI v4 docs).
- **Fix pagination**: drive page index and page size from shared state; slice the incoming `results` array (or equivalent) so views render only the current page; prev/next and page indicator reflect real totals.
- **Show total results**: the shared toolbar SHALL display the **total count** of items in the current filtered list (same array passed into paging), e.g. alongside pagination or as “N results” / “Showing a–b of N”, so users see scope beyond the current page.
- **Wire sorting** where a sort control exists (list view): apply a documented sort order to the filtered list before pagination (or document sort as no-op until fields exist).
- **Add select all / unselect all** to list view aligned with grid behavior, using `useSearchSelectionStore` (`selectAll`, `clear`, `toggle`) consistently.
- **Refactor** `ViewModeGrid.vue`, `ViewModeListSimple.vue`, and any other explorer viewmodes that duplicate toolbar patterns to use the shared pieces; replace ad-hoc markup with Nuxt UI equivalents where an alternative exists.
- Update requirements in `explorer-viewmode-grid-compare` so grid compare no longer treats pagination as a disabled placeholder when the shared toolbar is enabled.

## Capabilities

### New Capabilities

- `explorer-results-view-controls`: Shared, optional toolbar for explorer result viewmodes—pagination (page + size), **total filtered result count** (and optional range on page), sorting entry point, and bulk selection actions—implemented with Nuxt UI and a single composable or parent-controlled props contract so each view can enable subsets.

### Modified Capabilities

- `explorer-viewmode-grid-compare`: Grid compare SHALL use functional pagination aligned with `explorer-results-view-controls` (replace stub/disabled controls); normative text for “hits in the grid” SHALL clarify current page vs full filtered set where pagination applies.

## Impact

- **Code**: `apps/web/app/pages/explorer/explorer.vue` (optional: lift shared state), `apps/web/app/components/explorer/wf/viewmodes/ViewModeListSimple.vue`, `apps/web/app/components/explorer/wf/viewmodes/ViewModeGrid.vue`, new composable/components under `apps/web/app/components/explorer/` or `composables/`, `apps/web/app/stores/searchSelection.ts` (only if new helpers are needed), i18n keys for pagination, **total/range**, and selection if missing.
- **Dependencies**: Nuxt UI only (no new npm packages expected).
- **APIs**: None.
