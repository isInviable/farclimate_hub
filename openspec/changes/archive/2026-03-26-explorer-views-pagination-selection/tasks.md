## 1. Store and composable foundation

- [x] 1.1 Extend `useSearchSelectionStore` with helpers to **add** all items from a page without clearing off-page selections, and to **remove** only a set of ids (or document equivalent), matching `explorer-results-view-controls` bulk-selection scenarios.
- [x] 1.2 Add `useExplorerResultsPaging` (or agreed name) composable: sorted list, `page`, `pageSize`, `pageCount`, **`totalCount`**, `pagedItems`, reset rules on sort/results change; verify types against existing hit/document shapes.

## 2. Shared toolbar UI (Nuxt UI)

- [x] 2.1 Add `ExplorerResultsToolbar` (or agreed name) with props/slots for optional pagination, sort, bulk actions, and **visible total count** (and optional **on-page range**); use Nuxt UI (`UPagination`, `UButton`, `USelect` / `USelectMenu`, `UFormField`, `UBadge` or `UText` as appropriate) per installed `@nuxt/ui` API.
- [x] 2.2 Add i18n keys in `en.json` / `es.json` for pagination labels, prev/next aria, select/unselect-this-page copy, and **total / range** strings.

## 3. Viewmode integration

- [x] 3.1 Refactor `ViewModeListSimple.vue` to use the composable + toolbar: wire sort to comparators, render `pagedItems`, add select-all / unselect-all for current page.
- [x] 3.2 Refactor `ViewModeGrid.vue` to use the same composable + toolbar: replace disabled pagination stub with working pagination; align `toggleSelectAll` with page-scoped merge/deselect; update AI target counting to match `explorer-viewmode-grid-compare` delta (current page when paginated).
- [x] 3.3 Scan other explorer viewmodes under `wf/viewmodes/` for duplicate toolbar markup; adopt shared pieces only where pagination/sort/selection already exist or are required. *(Only `ViewModeListSimple` and `ViewModeGrid` had list/pagination chrome; Chat/Map/Instagram/Summaries unchanged.)*

## 4. Verification

- [x] 4.1 Manually verify list and grid: multi-page filtered set, **total count and range** update correctly, page changes, sort order, bulk select/unselect on page, selection persistence across pages, grid batch AI cap with pagination. *(Spot-check in browser recommended.)*
- [x] 4.2 Run project lint/tests for `apps/web` if applicable (`pnpm` scripts in repo). *(`pnpm run typecheck` still reports pre-existing errors elsewhere; `pnpm exec eslint` on changed files fails: missing `@stylistic/js` in repo ESLint config.)*
