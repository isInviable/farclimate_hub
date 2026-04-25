## Context

The explorer currently couples three separate concerns: loading result cards, discovering corpus totals, and computing filter counts. On initial page load, `loadAll()` requests `/api/search` with an empty query, the server calls `get_all_documents`, and the browser receives the full article corpus. The explorer then asks `/api/facets` for counts using the returned IDs.

For the MVP, facet totals should represent the whole corpus, and facet overlays should still show how many documents in the current returned result set have each facet. Spanish and English articles are translations of the same case studies, so corpus totals should count unique case studies/documents once; locale only affects displayed text.

## Goals / Non-Goals

**Goals:**

- Provide cached corpus metadata for the explorer without downloading every article.
- Show result count copy as `Showing <displayed> of <total> case studies`.
- Use global corpus facet counts as the source of truth for filter options and total bars.
- Keep current result-set facet counts so each option can show `current / total`.
- Keep cache invalidation simple: production paper refreshes invalidate by redeploying or restarting the server runtime.
- Bound the initial empty-query result request to the number of cards needed for display.

**Non-Goals:**

- Exact contextual facet counts across all possible hybrid/semantic matches beyond the returned result set.
- Exact total matching count for hybrid/semantic searches.
- Manual cache purge endpoints or admin cache controls.
- Locale-specific corpus totals, since English and Spanish represent the same case studies.
- Reworking ranking, pagination, or infinite scrolling beyond the bounded initial result load needed for this change.

## Decisions

### Add `/api/explorer/corpus-metadata`

Create a dedicated Nuxt server route for explorer corpus metadata rather than expanding `/api/search` or overloading `/api/facets`.

The endpoint should return a small payload such as:

```json
{
  "totalCount": 842,
  "globalFacets": {
    "sectors": [{ "value": "Agriculture", "count": 320 }],
    "climate_impacts": [],
    "adaptation_approaches": [],
    "keywords": [],
    "biogeographical_regions": []
  }
}
```

Rationale: search results and corpus metadata have different lifecycles. Result requests are query-dependent and user-driven; corpus metadata is stable between ingestion/deploy cycles and can be aggressively cached.

Alternative considered: keep calling `/api/facets` with all loaded hit IDs. That preserves current behavior but requires the browser to receive all documents before the filter UI has complete counts.

### Cache metadata server-side with Nitro

Use Nitro's server caching utilities for the corpus metadata route with a long max age. The deployment refresh process is the invalidation mechanism for MVP: when the production paper list is updated, redeploying or restarting the server clears the runtime cache and recomputes metadata on the next request.

Rationale: the paper corpus changes infrequently, and a long cache avoids repeated aggregate queries while keeping the implementation simple.

Alternative considered: materialized views or cache tables. They may be useful later, but they add database refresh semantics that are unnecessary for the MVP.

### Count unique case studies, not language rows

The corpus total should represent unique documents/case studies. Because Spanish and English content are translations of the same article set, the total should not double count translations.

Rationale: the UI copy says "case studies", not "localized content rows". Users should see the same total in English and Spanish.

Alternative considered: cache per-locale totals. This is unnecessary while the translated corpora remain 1:1.

### Use global facet totals plus result-set overlays

Facet filters should use global corpus counts as the stable denominator and fetch result-set counts after each search/load using the returned hit IDs. The UI should show the current count and the corpus total, for example `6 / 14`, with two bars on the same scale.

Rationale: visualizing the current search/filter set against the whole corpus is core to the explorer experience, while the cached corpus metadata still avoids downloading the full article corpus only to know global totals.

Alternative considered: show global corpus counts only. That simplifies the frontend but removes the core comparative visualization.

### Bound empty-query search results

Initial explorer loading should request only the result cards needed for the page, using a display limit. `/api/search` should no longer require the empty-query path to return the entire corpus to support explorer totals.

Rationale: the total comes from corpus metadata; results can be treated as a list of currently displayed hits.

Alternative considered: leave `/api/search` returning all documents and only ignore most results in the UI. That preserves the scaling problem.

## Risks / Trade-offs

- Result-set facet counts are based on returned hits, not an exact count over every possible hybrid/semantic match -> Mitigate by keeping result count copy as "showing" and treating facet overlays as the current returned result set.
- Long cache can serve stale totals after a paper refresh -> Mitigate by tying production refreshes to redeploy/restart for MVP.
- Empty-query search behavior may affect other consumers that expect every document -> Mitigate by checking usage and making the bounded behavior explicit in the `search-api` spec.
- Search result count remains "loaded/displayed", not "all matches" -> Mitigate with copy like `Showing 30 of 842 case studies` rather than `30 matching results`.

## Migration Plan

1. Add the cached corpus metadata endpoint and wire it to existing Supabase aggregate/facet logic.
2. Update explorer state to fetch corpus metadata independently from search results.
3. Change the explorer result counter to use displayed hit count plus cached corpus total.
4. Update facet components to consume global corpus counts and restored `for_result_set` counts.
5. Bound initial empty-query search loading.
6. Verify the explorer no longer downloads the full article corpus on initial load.

Rollback is straightforward: restore the previous `loadAll()` and `/api/facets` flow if the new endpoint fails, because the existing search and facets APIs remain available.

## Open Questions

- What exact long cache duration should be used for Nitro caching in production: days, weeks, or effectively until redeploy?
- Should the response include a `generatedAt` timestamp for debugging stale metadata, or stay minimal for MVP?
