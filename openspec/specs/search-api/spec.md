# Search API spec

Contract for the Nuxt server route `POST /api/search` that backs hybrid/keyword search. This spec reflects the current implementation (search tuning, debug, and filtering options).

---

### Requirement: POST /api/search request body

The system SHALL provide a Nuxt server route at `/api/search` (POST) that accepts a JSON body with:

| Parameter               | Type     | Default   | Description |
|-------------------------|----------|-----------|--------------|
| `query`                 | string   | —         | Search text. If empty, the endpoint returns all documents for the given language (no embedding). |
| `lang`                  | string   | `'en'`    | Language filter (`en`, `es`, etc.). |
| `limit`                 | number   | 30        | Maximum number of results to return (capped by RPC). |
| `mode`                  | string   | `'hybrid'`| `'hybrid'` or `'keyword'`. With `'keyword'`, no embedding is generated; only FTS is used. |
| `debug`                 | boolean  | false     | If true, the response SHALL include a `debug` object (see below). |
| `min_score`             | number   | 0.02      | Minimum RRF score; hits with `score < min_score` are excluded (server-side filter). Use 0 to disable. |
| `match_threshold`       | number   | 0.0       | Cosine similarity threshold (0.0–1.0) passed to `hybrid_search` RPC; filters the semantic CTE at DB level. 0 = no filter. |
| `full_text_weight`      | number   | 2         | Weight for keyword rank in RRF (passed to RPC). |
| `semantic_weight`       | number   | 1         | Weight for semantic rank in RRF (passed to RPC). |
| `rrf_k`                 | number   | 50        | RRF smoothing constant (passed to RPC). |
| `sectors`               | string[] | (omitted) | Optional. When present and non-empty, restrict results to documents that have at least one of these values in `knowledge.summary.sectors`. |
| `climate_impacts`       | string[] | (omitted) | Optional. When present and non-empty, restrict results to documents that have at least one of these values in `knowledge.summary.climate_impacts`. |
| `adaptation_approaches` | string[] | (omitted) | Optional. When present and non-empty, restrict results to documents that have at least one of these values in `knowledge.summary.adaptation_approaches`. |
| `keywords`              | string[] | (omitted) | Optional. When present and non-empty, restrict results to documents that have at least one of these values in `knowledge.summary.keywords`. |

When `query` is non-empty and `mode` is `'hybrid'`, the endpoint SHALL generate a query embedding (Gemini `gemini-embedding-001`, 768 dimensions, `RETRIEVAL_QUERY`), call `knowledge.hybrid_search` with the above tuning parameters, then filter results by `min_score`, apply facet filtering when any of `sectors`, `climate_impacts`, `adaptation_approaches`, `keywords` are provided (see Requirement: Facet filter result restriction), fetch full document data for the remaining ids, and return the normalized response.

When `query` is non-empty and `mode` is `'keyword'`, the endpoint SHALL call `knowledge.keyword_search` only (no embedding) and return results with score set from the keyword rank, then apply the same facet filtering and fetch step when facet params are provided.

When embedding generation fails (e.g. API error or dimension mismatch), the endpoint SHALL fall back to keyword-only search and SHALL NOT return 500 for that reason alone.

#### Scenario: Hybrid search with query
- **WHEN** the client POSTs `{ "query": "flood protection", "lang": "en", "limit": 10 }`
- **THEN** the endpoint SHALL generate an embedding, call `hybrid_search` with default weights and thresholds, filter by `min_score`, and return up to 10 hits with full document data

#### Scenario: Keyword-only mode
- **WHEN** the client POSTs `{ "query": "flood", "lang": "en", "mode": "keyword" }`
- **THEN** the endpoint SHALL NOT call Gemini; it SHALL call `keyword_search` only and return results with score from FTS rank

#### Scenario: Load all documents
- **WHEN** the client POSTs `{ "query": "", "lang": "en" }`
- **THEN** the endpoint SHALL return all documents for that language via `get_all_documents` without generating an embedding

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
  - `document` (object) — full document fields (title, summary, fulltext, keywords, sectors, geographic_characterisation, implementation_years, etc. as provided by `get_documents_by_ids`).

When `debug` is true, the response SHALL also include:

- `debug` (object) — `mode`, `min_score`, `match_threshold`, `filtered_count`, `total_before_filter`, optional RRF params, and `raw` array of per-hit debug info.

#### Scenario: Normal response
- **WHEN** a search returns 5 hits and `debug` is not set
- **THEN** the response SHALL be `{ "count": 5, "hits": [ ... ] }` with no `debug` key

#### Scenario: Error response
- **WHEN** the endpoint encounters an unrecoverable error (e.g. Supabase RPC failure with no fallback)
- **THEN** the endpoint SHALL respond with an appropriate HTTP error status and message

---

### Requirement: Embedding cache

The endpoint SHALL cache query embeddings in memory (by `lang` and normalized query text) for a short TTL (e.g. 10 minutes) and SHALL reuse the cached embedding when the same query+lang is requested again within that window, so that repeated identical searches do not call the Gemini API again.

#### Scenario: Cache hit
- **WHEN** the same `query` and `lang` are sent twice within the TTL
- **THEN** the second request SHALL use the cached embedding and SHALL NOT call the embedding API a second time
