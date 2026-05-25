## 1. Backend Search Contract

- [x] 1.1 Define the explorer search request and response types, including `limit`, `offset`, `includeFacets`, `total`, page hit count, and optional facet metadata.
- [x] 1.2 Add a dedicated explorer search server path or RPC integration that coexists with the current `/api/search` route.
- [x] 1.3 Implement normalized parsing for query, language, active facet arrays, mode, and ranking parameters used to form the search signature.
- [x] 1.4 Preserve OR-within-category and AND-across-category filter behavior in the new explorer search path.

## 2. Database Query Flow

- [x] 2.1 Build a lightweight matched-ID query for empty-query browse requests using `knowledge.summary` and existing document identity tables.
- [x] 2.2 Build a lightweight matched-ID query for keyword or hybrid searches using the existing full-text/vector search logic and a candidate count separate from page limit.
- [x] 2.3 Compute `total` from the full matched-ID set when `includeFacets` is enabled.
- [x] 2.4 Compute full-match facet counts from `knowledge.summary` for the matched-ID set when `includeFacets` is enabled.
- [x] 2.5 Select page IDs by `limit` and `offset`, then hydrate full article data only for those page IDs.
- [x] 2.6 Ensure page-only requests skip total/facet recomputation and return only the requested page hits plus pagination placement metadata.

## 3. Frontend Search State

- [x] 3.1 Update the explorer search composable/store to call the new explorer search path.
- [x] 3.2 Add a stable normalized search signature for query, language, active filters, mode, and ranking-affecting parameters.
- [x] 3.3 Store aggregate metadata separately from page hits so `total` and facet counts persist during page-only navigation.
- [x] 3.4 Cache loaded pages by search signature and merge newly loaded hits without dropping previous pages.
- [x] 3.5 Clear cached pages and aggregate metadata when the search signature changes.

## 4. Explorer UI Behavior

- [x] 4.1 Update result count display to use full-match `total` rather than the current page length.
- [x] 4.2 Update facet indicators to use full-match `for_result_set` counts returned by the explorer search metadata.
- [x] 4.3 Add or adjust pagination/load-more controls to request page-only results for unchanged search signatures.
- [x] 4.4 Ensure visible result views render the intended current page while the store retains accumulated loaded pages.

## 5. Chat With Results

- [x] 5.1 Update chat-with-results source selection to use accumulated loaded hits for the active search signature.
- [x] 5.2 Ensure cached hits from previous search signatures are excluded from chat context.
- [x] 5.3 Preserve existing chat context bounding or truncation behavior when accumulated loaded hits exceed the model context budget.

## 6. Verification

- [x] 6.1 Add or update API tests for full-match totals and facet counts when matches exceed page limit.
- [x] 6.2 Add or update API tests for page-only requests that do not include facet metadata.
- [x] 6.3 Add or update frontend tests for page cache retention and cache clearing on search changes.
- [x] 6.4 Manually verify the Disaster Risk Reduction plus Buildings case shows accurate full-match facet indicators.
- [x] 6.5 Manually verify chat with results can use documents loaded from multiple pages of the same search.
