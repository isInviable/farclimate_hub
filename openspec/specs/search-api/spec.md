# Search API spec

## Purpose

Contract for the Nuxt server route `POST /api/search` that backs hybrid/keyword search. This spec reflects the current implementation (search tuning, debug, and filtering options).

## Requirements

### Requirement: POST /api/search request body

The system SHALL provide a Nuxt server route at `/api/search` (POST) that accepts a JSON body with:


| Parameter               | Type     | Default    | Description                                                                                                                                              |
| ----------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `query`                 | string   | —          | Search text. If empty, the endpoint returns a bounded set of documents for the given language without generating an embedding.                            |
| `lang`                  | string   | `'en'`     | Language filter (`en`, `es`, etc.).                                                                                                                      |
| `limit`                 | number   | 30         | Maximum number of results to return.                                                                                                                     |
| `mode`                  | string   | `'hybrid'` | `'hybrid'` or `'keyword'`. With `'keyword'`, no embedding is generated; only FTS is used.                                                                |
| `debug`                 | boolean  | false      | If true, the response SHALL include a `debug` object (see below).                                                                                        |
| `min_score`             | number   | 0.02       | Minimum RRF score; hits with `score < min_score` are excluded (server-side filter). Use 0 to disable.                                                    |
| `match_threshold`       | number   | 0.0        | Cosine similarity threshold (0.0–1.0) passed to `hybrid_search` RPC; filters the semantic CTE at DB level. 0 = no filter.                                |
| `full_text_weight`      | number   | 2          | Weight for keyword rank in RRF (passed to RPC).                                                                                                          |
| `semantic_weight`       | number   | 1          | Weight for semantic rank in RRF (passed to RPC).                                                                                                         |
| `rrf_k`                 | number   | 50         | RRF smoothing constant (passed to RPC).                                                                                                                  |
| `sectors`               | string[] | (omitted)  | Optional. When present and non-empty, restrict results to documents that have at least one of these values in `knowledge.summary.sectors`.               |
| `climate_impacts`       | string[] | (omitted)  | Optional. When present and non-empty, restrict results to documents that have at least one of these values in `knowledge.summary.climate_impacts`.       |
| `adaptation_approaches` | string[] | (omitted)  | Optional. When present and non-empty, restrict results to documents that have at least one of these values in `knowledge.summary.adaptation_approaches`. |
| `keywords`              | string[] | (omitted)  | Optional. When present and non-empty, restrict results to documents that have at least one of these values in `knowledge.summary.keywords`.              |


When `query` is non-empty and `mode` is `'hybrid'`, the endpoint SHALL generate a query embedding (Gemini `gemini-embedding-001`, 768 dimensions, `RETRIEVAL_QUERY`), call `knowledge.hybrid_search` with the above tuning parameters, then filter results by `min_score`, apply facet filtering when any of `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords` are provided (see Requirement: Facet filter result restriction), fetch full document data for the remaining ids, and return the normalized response.

When `query` is non-empty and `mode` is `'keyword'`, the endpoint SHALL call `knowledge.keyword_search` only (no embedding) and return results with score set from the keyword rank, then apply the same facet filtering and fetch step when facet params are provided.

When `query` is empty, the endpoint SHALL return a bounded set of documents for the given language up to `limit` and SHALL NOT generate an embedding. The endpoint SHALL NOT require returning the full corpus to support explorer totals; corpus totals SHALL come from `GET /api/explorer/corpus-metadata`.

When embedding generation fails (e.g. API error or dimension mismatch), the endpoint SHALL fall back to keyword-only search and SHALL NOT return 500 for that reason alone.

#### Scenario: Hybrid search with query

- **WHEN** the client POSTs `{ "query": "flood protection", "lang": "en", "limit": 10 }`
- **THEN** the endpoint SHALL generate an embedding, call `hybrid_search` with default weights and thresholds, filter by `min_score`, and return up to 10 hits with full document data

#### Scenario: Keyword-only mode

- **WHEN** the client POSTs `{ "query": "flood", "lang": "en", "mode": "keyword" }`
- **THEN** the endpoint SHALL NOT call Gemini; it SHALL call `keyword_search` only and return results with score from FTS rank

#### Scenario: Bounded empty-query documents

- **WHEN** the client POSTs `{ "query": "", "lang": "en", "limit": 30 }`
- **THEN** the endpoint SHALL return no more than 30 documents for that language without generating an embedding

#### Scenario: Empty-query totals are externalized

- **WHEN** the client needs the total number of case studies in the corpus
- **THEN** the client SHALL use `GET /api/explorer/corpus-metadata` rather than relying on `/api/search` with an empty query to return every document

#### Scenario: Debug response

- **WHEN** the client POSTs `{ "query": "flood", "debug": true }`
- **THEN** the response SHALL include `debug` with at least: `mode`, `min_score`, `match_threshold`, `filtered_count`, `total_before_filter`, and when mode is hybrid: `full_text_weight`, `semantic_weight`, `rrf_k`, and `raw` (array of `{ id, title, score, keyword_rank, semantic_rank }` per hit)

#### Scenario: Min score filter

- **WHEN** the client POSTs with `min_score: 0.02` (default) and the RPC returns results with some scores below 0.02
- **THEN** the endpoint SHALL exclude those hits and return only hits with `score >= 0.02`; the response count SHALL reflect the filtered set

#### Scenario: Match threshold passed to RPC

- **WHEN** the client POSTs with `match_threshold: 0.3`
- **THEN** the endpoint SHALL pass `match_threshold: 0.3` to `hybrid_search` so that the semantic CTE excludes documents with cosine similarity < 0.3

#### Scenario: Facet params accepted

- **WHEN** the client POSTs with one or more of `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords` as non-empty string arrays
- **THEN** the endpoint SHALL apply facet filtering so that only documents satisfying all provided facet categories are returned (see Requirement: Facet filter result restriction)

---

### Requirement: Facet filter result restriction

When the request body includes one or more of `sectors`, `climate_impacts`, `adaptation_approaches`, or `keywords` as non-empty arrays of strings, the endpoint SHALL restrict the result set to documents that satisfy every provided category. For each provided category, a document SHALL be retained only if its corresponding array in `knowledge.summary` (e.g. `sectors`, `climate_impacts`) overlaps with the requested array (at least one value in common). Omitted or empty arrays SHALL not restrict that category.

#### Scenario: Single category filter

- **WHEN** the client POSTs `{ "query": "flood", "lang": "en", "sectors": ["Agriculture"] }`
- **THEN** the endpoint SHALL return only hits whose document has "Agriculture" in `knowledge.summary.sectors`

#### Scenario: AND across categories

- **WHEN** the client POSTs `{ "query": "", "lang": "en", "sectors": ["Agriculture"], "climate_impacts": ["Drought"] }`
- **THEN** the endpoint SHALL return only documents that have at least one of the selected sectors and at least one of the selected climate_impacts

#### Scenario: OR within category

- **WHEN** the client POSTs `{ "sectors": ["Agriculture", "Forestry"], "lang": "en" }` (load all with sector filter)
- **THEN** the endpoint SHALL return documents that have either "Agriculture" or "Forestry" (or both) in `knowledge.summary.sectors`

#### Scenario: No facet params

- **WHEN** the client POSTs without any of `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords` or with all omitted/empty
- **THEN** the endpoint SHALL NOT apply facet filtering; behavior SHALL match the previous search-only semantics

#### Scenario: Client sends only active filter params

- **WHEN** the client sends facet params only for filters that are currently active (per explorer-facet-filters spec)
- **THEN** omitted facet keys SHALL be treated as no restriction for that category; the endpoint SHALL not infer filter values from inactive UI filters

---

### Requirement: Response shape

The endpoint SHALL return a JSON object with:

- `count` (number) — number of hits returned (after `min_score` filter).
- `hits` (array) — each element SHALL have:
  - `id` (UUID)
  - `document_uid` (string)
  - `score` (number)
  - `document` (object) — full document fields (title, summary, fulltext, keywords, sectors, geographic_characterisation, implementation_years, etc. as provided by `get_documents_by_ids`), **including** optional nullable `recipe_ingredients` (JSON object of string section → markdown) when the RPC returns it for the requested `lang`.

When `debug` is true, the response SHALL also include:

- `debug` (object) — `mode`, `min_score`, `match_threshold`, `filtered_count`, `total_before_filter`, optional RRF params, and `raw` array of per-hit debug info.

#### Scenario: Normal response

- **WHEN** a search returns 5 hits and `debug` is not set
- **THEN** the response SHALL be `{ "count": 5, "hits": [ ... ] }` with no `debug` key

#### Scenario: Document includes recipe when available

- **WHEN** `get_documents_by_ids` returns `recipe_ingredients` for a document and language
- **THEN** the corresponding `hit.document` in the search response SHALL include the same `recipe_ingredients` value (object or null)

#### Scenario: Error response

- **WHEN** the endpoint encounters an unrecoverable error (e.g. Supabase RPC failure with no fallback)
- **THEN** the endpoint SHALL respond with an appropriate HTTP error status and message

---

### Requirement: GET /api/document-recipe

The system SHALL provide a Nuxt server route at `**GET /api/document-recipe`** with query parameters:


| Parameter    | Type   | Required | Description                      |
| ------------ | ------ | -------- | -------------------------------- |
| `documentId` | string | yes      | UUID of `knowledge.documents.id` |
| `lang`       | string | no       | Language code; default `en`      |


The handler SHALL return JSON `{ "recipe_ingredients": <object \| null> }`. It SHALL call `get_documents_by_ids` with `doc_ids` containing that id and `filter_lang` set from `lang`, and use the row’s `recipe_ingredients` when present. When the column is null or absent (e.g. older deployed RPC), the implementation MAY read `knowledge.recipe.ingredients` for the same `(document_id, lang)` if that table is reachable. The route SHALL NOT call an LLM. A missing `documentId` SHALL yield HTTP 400.

#### Scenario: Recipe returned from RPC

- **WHEN** the client requests `GET /api/document-recipe?documentId=<uuid>&lang=en` and `get_documents_by_ids` returns a row with non-null `recipe_ingredients`
- **THEN** the response body SHALL include the same object under `recipe_ingredients`

#### Scenario: No recipe row

- **WHEN** no `knowledge.recipe` exists for that document and language and the RPC returns null for `recipe_ingredients`
- **THEN** the response SHALL be `{ "recipe_ingredients": null }`

#### Scenario: Invalid request

- **WHEN** `documentId` is omitted
- **THEN** the server SHALL respond with HTTP 400

---

### Requirement: Embedding cache

The endpoint SHALL cache query embeddings in memory (by `lang` and normalized query text) for a short TTL (e.g. 10 minutes) and SHALL reuse the cached embedding when the same query+lang is requested again within that window, so that repeated identical searches do not call the Gemini API again.

#### Scenario: Cache hit

- **WHEN** the same `query` and `lang` are sent twice within the TTL
- **THEN** the second request SHALL use the cached embedding and SHALL NOT call the embedding API a second time

---

### Requirement: Explorer search path separates aggregate metadata from page fetching

The system SHALL provide an explorer-oriented search API path or RPC integration that supports requesting aggregate metadata separately from page-only article fetching. This path SHALL accept the supported explorer facet filters `sectors`, `climate_impacts`, `adaptation_approaches`, and `biogeographical_regions` when provided by the client. This path SHALL coexist with the existing `/api/search` contract unless and until existing consumers are migrated.

#### Scenario: Aggregate metadata requested

- **WHEN** the explorer sends a search request whose query, filters, language, or ranking parameters differ from the previous active search
- **THEN** the API SHALL support returning the full matching result `total`, full-match facet metadata, and the requested page of full article hits

#### Scenario: Page-only request for same search

- **WHEN** the explorer requests a different page with the same normalized search signature
- **THEN** the API SHALL support returning only that page of full article hits without returning or recomputing aggregate metadata

#### Scenario: Adaptation approaches accepted by explorer search

- **WHEN** the explorer sends `adaptation_approaches` as a non-empty array in the search request
- **THEN** the API SHALL restrict the matching set to documents whose `knowledge.summary.adaptation_approaches` overlaps with the requested values

#### Scenario: Keywords remain API-supported but not explorer-exposed

- **WHEN** the existing search API receives `keywords` from a valid non-explorer consumer
- **THEN** the API MAY continue to apply keyword facet filtering according to the existing search contract
- **AND** the explorer filter UI SHALL NOT expose Keywords as a selectable filter

### Requirement: Explorer client sends only supported server-backed filter parameters

The explorer client SHALL map active filter UI state to server-backed search parameters using only the supported explorer filter set: `sectors`, `climate_impacts`, `adaptation_approaches`, and `biogeographical_regions`. The explorer client SHALL NOT send unsupported UI leftovers such as `time`, `phases`, or `scales`.

#### Scenario: Adaptation approaches mapped from UI state

- **WHEN** the Adaptation approaches filter is active with one or more selected values
- **THEN** the explorer search request body SHALL include `adaptation_approaches` with those selected values

#### Scenario: Keywords omitted from explorer UI requests

- **WHEN** the explorer user applies filters through the sidebar
- **THEN** the request body SHALL NOT include `keywords` unless a future capability explicitly exposes a Keywords filter

#### Scenario: Unsupported filter keys omitted

- **WHEN** effective explorer filter state contains `time`, `phases`, or `scales`
- **THEN** the request body SHALL omit those keys

### Requirement: Explorer search response distinguishes returned count from full total

The explorer search response SHALL distinguish the number of hits returned in the current page from the total number of matching documents in the full result set.

#### Scenario: More matches than page limit

- **WHEN** a search matches 83 documents and the requested page limit is 60
- **THEN** the response SHALL expose `total: 83`
- **AND** the page hit collection SHALL contain no more than 60 full article hits

#### Scenario: Page-only response

- **WHEN** aggregate metadata is not requested for a page-only response
- **THEN** the response SHALL still expose enough pagination information for the client to place the returned hits in the active page cache

