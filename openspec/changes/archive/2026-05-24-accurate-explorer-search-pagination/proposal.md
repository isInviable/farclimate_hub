## Why

Explorer facet indicators currently compare corpus-wide counts against counts computed only from the limited result slice returned to the client. This makes selected filters appear inconsistent when the true matching set is larger than the current limit.

The explorer needs accurate result totals and facet counts without transferring every matching article to the browser or recomputing expensive metadata on simple page changes.

## What Changes

- Add a dedicated explorer search path, tentatively `explorer_search`, instead of stretching the existing `/api/search` plus `/api/facets` two-step flow.
- Keep existing facet logic: OR within a facet category and AND across categories.
- Move filtering, total counting, facet counting, pagination, and current-page document hydration into one backend operation for query/filter changes.
- Return a page of full article hits plus aggregate metadata for the full matching set.
- Support page-only requests that fetch only article data for the requested page and do not recompute total or facet metadata.
- Cache loaded result pages in the client until the search signature changes, so page navigation preserves previously loaded hits.
- Allow chat-with-results to use accumulated loaded pages from the current search, enabling users to combine results from page 1, page 2, and later pages.
- Avoid database schema/index changes for now; use the existing `knowledge.summary`, full-text, embedding, and document hydration structures.

## Capabilities

### New Capabilities

- `explorer-search-pagination`: Server-backed explorer search, accurate full-match totals/facets, page-only fetching, and client retention of loaded pages for the active search.

### Modified Capabilities

- `search-api`: Explorer search behavior changes from limited-slice counts toward a paginated response with accurate full-match metadata.
- `filter-facets`: Result-set facet counts must represent the full matching search/filter set, not only currently returned hit IDs.
- `explorer-document-chat`: Chat context may use accumulated loaded results for the active search instead of only the latest page.

## Impact

- Affected server/API code: explorer search route/RPC integration, current `/api/search` usage, and facet-count fetching flow.
- Affected database access: read-only SQL/RPC logic over `knowledge.summary`, `knowledge.fulltext`, `knowledge.embeddings`, and document hydration helpers.
- Affected frontend state: search composable/store, result pagination state, facet metadata state, and accumulated loaded-page cache.
- Affected UI behavior: result counts, facet indicators, pagination/load-more behavior, and chat-with-results source set.
- No immediate database optimization or migration is required; existing GIN and vector/fulltext indexes are sufficient for the expected 300-400 item corpus.
