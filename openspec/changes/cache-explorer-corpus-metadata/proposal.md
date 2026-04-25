## Why

The explorer currently starts by loading the full article corpus into the browser so it can show totals and drive the initial filter UI. This does not scale and conflicts with the desired explorer model where the page loads only the result cards it needs while still showing corpus-level totals.

## What Changes

- Add a cached server endpoint at `GET /api/explorer/corpus-metadata` that returns corpus-level metadata for the explorer, including the total number of unique case studies and global facet counts.
- Use long-lived Nitro server caching for the corpus metadata response, relying on deploy-based invalidation when the production paper list is refreshed.
- Update the explorer to show copy equivalent to `Showing 30 of 842 case studies`, where the first number is the currently displayed/loaded result count and the second number is the cached corpus total.
- Drive explorer facet option totals from global corpus metadata while also showing how many of the currently returned search/filter results belong to each facet.
- Stop treating initial explorer load as a request for every article; initial empty-query results should be bounded to the display limit.
- Preserve the two-count facet visualization: current result-set count in relation to the whole corpus total for that facet value.

## Capabilities

### New Capabilities
- `explorer-corpus-metadata`: Provides a cached corpus-level metadata API for explorer totals and global facet counts.

### Modified Capabilities
- `search-api`: Empty-query explorer requests should support bounded result loading instead of requiring all documents to be returned to the browser.
- `explorer-facet-filters`: Facet options should use global corpus totals and retain result-set counts so each facet visualizes the current search/filter result in relation to the whole corpus.

## Impact

- Affects Nuxt server API routes under `apps/web/server/api`, especially the new `api/explorer/corpus-metadata` route and the empty-query search path.
- Affects explorer frontend data flow in `apps/web/app/pages/explorer/explorer.vue`, `apps/web/app/composables/useHybridSearch.ts`, the search store, and `apps/web/app/components/explorer/deliverable1/*Filter.vue`.
- Reuses existing Supabase facet/count logic where possible, including global counts from `get_filter_facets`.
- Introduces Nitro server-side response caching for corpus metadata with a long TTL and deploy-based invalidation semantics.
- Retains contextual result-set facet counts for the currently returned hits, while avoiding the initial full-corpus document download.
