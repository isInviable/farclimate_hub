## Context

The explorer currently receives a limited set of search hits from `/api/search`, then posts those hit IDs to `/api/facets` to compute `for_result_set` counts. This makes the displayed facet numerator represent only the returned slice, not the full matching result set. With `limit: 60`, a query that matches more than 60 documents can show misleading counts such as `45/57` for a selected sector even when more matching documents exist outside the slice.

The intended product behavior remains unchanged for filters: selected values within one category are ORed, and separate categories are ANDed. The desired change is to make counts and pagination reflect that behavior accurately while avoiding full result transfer to the browser.

The live corpus is small today and expected to remain around 300-400 case studies. Existing indexes on `knowledge.summary` arrays, full text, and embeddings are sufficient for now. No database optimization or migration is part of this proposal.

## Goals / Non-Goals

**Goals:**

- Return accurate total counts and facet counts for the full matching search/filter set.
- Transfer only the current page of full article payloads to the client.
- Avoid recomputing total and facet metadata on page-only navigation.
- Keep OR-within-category and AND-across-category filtering semantics.
- Cache loaded pages locally until the active search changes.
- Let chat-with-results use accumulated loaded results from the current search, not only the latest page.
- Keep facet counting close to the matched IDs in SQL/RPC logic over `knowledge.summary`.

**Non-Goals:**

- Do not change filter semantics.
- Do not add database indexes, generated columns, materialized views, or other schema optimizations now.
- Do not send all matching full article payloads to the client.
- Do not make `/api/facets` responsible for reconstructing search semantics from returned page IDs.
- Do not redesign chat prompts or model behavior beyond the set of documents supplied as context.

## Decisions

### Introduce an Explorer-Specific Search Path

Create a dedicated explorer search path, tentatively `explorer_search`, rather than stretching the current `/api/search` plus `/api/facets` flow. This path can be a Nuxt API route backed by one or more Supabase RPC calls, but the contract should be explorer-oriented: page hits plus optional aggregate metadata.

Alternative considered: keep `/api/search` and call `/api/facets` with returned IDs. This preserves the current shape but cannot produce full-match facet counts when only one page of IDs is available.

### Split Metadata Requests from Page-Only Requests

When query, filters, language, mode, or tuning parameters change, the server computes the full lightweight matching set, total count, full-match facet counts, and the first requested page. When only `offset` or page changes for the same search signature, the client requests only page hits and reuses the existing metadata.

Alternative considered: recompute facets for every page. This is simpler and acceptable at the expected corpus size, but it wastes database work and makes the desired behavior less explicit.

### Count Facets from Lightweight Matched IDs

Facet counting should operate against `knowledge.summary` rows for the full matched ID set. Full document hydration, including images, fulltext, recipe, and multilingual joins, should happen only after page IDs are selected.

Alternative considered: fetch many IDs into Nuxt and send them back to a generic facets endpoint. This adds round trips and keeps the application server responsible for stitching search and facet semantics together.

### Preserve Existing Filter Semantics

The new search path keeps OR within a category and AND across categories. Omitted or empty categories do not restrict results.

Alternative considered: require all selected values within a category. That behavior is less common for faceted search and is out of scope for this change.

### Cache Loaded Pages by Search Signature

The client keeps a cache keyed by the normalized active search signature: query, language, mode/tuning fields that affect result order, and active filters. The cache stores loaded pages and an accumulated hit map/list. Changing the signature clears the cache and metadata.

Page changes for the same signature append or merge newly loaded hits into the local cache without removing already loaded pages. This lets the user collect context from multiple pages for chat-with-results.

Alternative considered: replace results on every page navigation. This is memory-light but prevents cross-page chat context and loses already loaded page data.

## Risks / Trade-offs

- Accurate facets require extra SQL work when the search signature changes → Mitigation: compute them only on signature changes and operate on lightweight IDs/summary rows.
- Client page cache can grow if the user visits many pages → Mitigation: expected corpus is 300-400 items; cache is cleared on search signature change and stores only currently loaded result pages.
- Page-only requests must use the exact same search signature as the metadata request → Mitigation: define a stable normalized signature and treat any semantic change as a new search.
- Hybrid search totals may depend on candidate limits rather than the whole corpus if search ranking only evaluates top candidates → Mitigation: make candidate limit explicit and separate from page limit; document the behavior in the API contract.
- Chat context can become larger as more pages are loaded → Mitigation: continue applying existing chat context limits or truncation, but source documents from accumulated loaded hits.

## Migration Plan

1. Add the new explorer search API/RPC path behind the existing explorer UI usage.
2. Update the explorer search composable/store to use the new response shape and maintain search metadata separately from page hits.
3. Update facet indicators to read full-match `for_result_set` counts from search metadata.
4. Update pagination/load-more behavior to request page hits without facet recomputation when the search signature is unchanged.
5. Update chat-with-results to use accumulated loaded hits for the active search.
6. Keep existing `/api/search` and `/api/facets` contracts available for other consumers during rollout.
7. Roll back by switching the explorer composable back to the existing `/api/search` plus `/api/facets` flow.
