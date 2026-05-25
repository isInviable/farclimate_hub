# How Explorer Search Works

The explorer search combines text search, semantic search, structured filters, server-side pagination, and accurate facet counts. The goal is to show relevant case studies without sending every matching document to the browser at once.

## Search Modes

### Keyword Search

Keyword search uses the full text of documents. Only documents that contain the query terms, or language-specific close variants, are considered.

This is useful for precise phrases, named topics, places, organizations, or terms that should appear directly in the source text.

### Semantic Search

Semantic search uses vector embeddings to find documents that are similar in meaning to the query, even when they do not use the same words.

This is useful for thematic searches such as "drought adaptation", "flood risk in agriculture", or "urban heat resilience".

### Hybrid Ranking

By default, the explorer uses hybrid search. The system runs both keyword and semantic search, then merges and re-ranks the results so documents that match both the terms and the meaning tend to appear higher.

Keyword-only mode is also supported by the search backend when the product needs exact term matching without semantic expansion.

In short:

1. The user enters a query.
2. The server runs hybrid search by default.
3. Keyword and semantic candidates are merged and ranked.
4. Filters are applied.
5. The server returns the requested page of documents plus aggregate metadata when needed.

## Empty Search

When the query is empty, the explorer behaves as a browsable catalogue. It does not generate a semantic embedding. Instead, it starts from the document collection and applies the active filters.

This is what happens on initial load and when the user is browsing with filters but no text query.

## Filters

The explorer currently supports filters on:

- Sector, for example Agriculture, Forestry, Water management, Disaster Risk Reduction.
- Climate impacts, for example Droughts, Flooding, Extreme heat.
- Biogeographical region.

The filter model is:

- Across filter types, conditions are combined with AND. For example, selected sectors plus selected climate impacts means documents must match at least one selected sector and at least one selected climate impact.
- Within one filter type, multiple selected values are combined with OR. For example, Agriculture plus Forestry means documents can match Agriculture or Forestry or both.
- Only active filters restrict the results. If a filter group is turned off in the UI, its selected values do not restrict the search.
- Empty filter groups do not restrict the results.

Example:

```json
{
  "query": "",
  "lang": "en",
  "sectors": ["Disaster Risk Reduction", "Buildings"]
}
```

This returns documents that have either Disaster Risk Reduction or Buildings as a sector. It does not require documents to have both sectors.

## Facet Counts

Facet indicators show two counts:

- The total corpus count: how many documents in the whole collection have that facet value.
- The current result-set count: how many documents in the full matching result set have that facet value.

For example, `57/57` for Disaster Risk Reduction means:

- 57 documents in the current search result set have Disaster Risk Reduction.
- 57 documents in the whole corpus have Disaster Risk Reduction.

The current result-set count is not the count for only the visible page. It is computed over the full matching set for the active query, language, and filters.

This is different from the previous behavior. Previously, the explorer computed facet result counts from the limited set of results already returned to the browser. If the page limit was 60 and the true matching set was larger, counts could be misleading, such as `45/57`. The current implementation computes those counts on the server from the full lightweight matching set, so pagination does not distort the facet indicators.

## Pagination

The explorer does not transfer every matching full document to the browser at once.

When the query, language, filters, or ranking parameters change, the server computes:

- The full matching document ID set.
- The total number of matches.
- Facet counts for the full matching set.
- Full article data only for the requested page.

When only the page changes, the client requests:

- Full article data for that page only.
- Pagination placement metadata such as `limit` and `offset`.

Facet counts and totals are reused during page-only navigation. They are recomputed only when the search signature changes.

The default page size is controlled by the client search composable. Smaller pages reduce payload size and rendering work; larger pages reduce the number of page requests.

## Search Signature

The client keeps a normalized search signature for the active search. The signature includes the query, language, active filters, search mode, and ranking parameters that affect the result set or order.

If the signature changes, the explorer treats it as a new search and clears previous page cache and aggregate metadata.

If only the page changes, the signature stays the same and the explorer reuses the existing total and facet metadata.

## Loaded Page Cache

Loaded pages are cached in the client for the active search signature.

This means:

- Page 1 can be loaded and kept.
- Page 2 can be loaded later and added to the same active cache.
- Navigating between already loaded pages does not need to refetch those pages.
- Changing the query, language, filters, mode, or ranking parameters clears the cache.

The visible result list shows the current page, but the application also retains the accumulated loaded pages for features that need them.

## Chat With Results

Chat with results can use the accumulated loaded hits for the active search, not only the currently visible page.

For example, a user can load page 1, select some results, load page 2, select more results, and then use those loaded results as chat context.

Cached hits from previous searches are excluded because changing the search signature clears the active loaded-page cache.

To keep model context bounded, the chat layer still limits how much loaded content is sent to the model. Loading many pages does not mean every full article is sent in full.

## Language

Search is scoped by language, such as English, Spanish, or Italian. The selected language affects:

- Full-text search.
- Multilingual document fields returned to the UI.
- The normalized search signature.

Changing language is treated as a new search.

## Summary

The current explorer search flow is:

1. The user searches or changes filters.
2. The server computes the full lightweight matching set.
3. The server returns accurate totals and full-match facet counts.
4. The server hydrates and returns only the requested page of full article data.
5. Page navigation fetches only page documents and reuses aggregate metadata.
6. Loaded pages are cached for the active search and can be used by chat with results.
