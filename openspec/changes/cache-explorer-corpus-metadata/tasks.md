## 1. Corpus Metadata API

- 1.1 Add a typed corpus metadata response shape for `totalCount` and `globalFacets`.
- 1.2 Create `GET /api/explorer/corpus-metadata` as a Nuxt server route.
- 1.3 Implement the route using Supabase aggregate/facet data without returning article documents.
- 1.4 Wrap the route with Nitro server-side caching using a long cache lifetime and deploy-based invalidation semantics.
- 1.5 Ensure `totalCount` counts unique case studies/documents once, not localized English and Spanish content rows.

## 2. Bounded Search Loading

- 2.1 Update the empty-query `/api/search` path to respect `limit` and return a bounded result set.
- 2.2 Preserve existing non-empty hybrid and keyword search behavior.
- 2.3 Verify facet-filtered empty-query searches still apply active facet filters before limiting results.
- 2.4 Update or add API tests covering bounded empty-query results.

## 3. Explorer Frontend Data Flow

- 3.1 Add explorer state/composable logic to fetch corpus metadata independently from result searches.
- 3.2 Update initial explorer load to request bounded results instead of loading the full corpus.
- 3.3 Update the result counter to display wording equivalent to `Showing <displayed> of <total> case studies`.
- 3.4 Ensure the counter does not imply the corpus total is the number of matching search results.

## 4. Facet UI

- 4.1 Wire `FilterManager` and facet filter components to use global corpus totals plus `for_result_set` counts.
- 4.2 Keep result-set `doc_ids` facet refetching after search/load completion.
- 4.3 Restore two-bar facet rendering with `current / total` counters.
- 4.4 Ensure Sector, Hazards, and Biogeographical regions filters still send active filter values to `/api/search`.

## 5. Verification

- 5.1 Verify initial explorer network traffic does not download the full article corpus.
- 5.2 Verify `GET /api/explorer/corpus-metadata` returns total count and all global facet categories.
- 5.3 Verify English and Spanish explorer views show the same corpus total.
- 5.4 Verify applying filters changes displayed results while facet counts show current result set in relation to corpus totals.
- 5.5 Run relevant API/frontend tests and document any remaining manual checks. Automated API tests pass; full typecheck and ESLint remain blocked by existing unrelated project/config errors.