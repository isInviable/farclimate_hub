# Search API (delta)

---

## MODIFIED Requirements

### Requirement: Response shape

The endpoint SHALL return a JSON object with:

- `count` (number) — number of hits returned (after `min_score` filter).
- `hits` (array) — each element SHALL have:
  - `id` (UUID)
  - `document_uid` (string)
  - `score` (number)
  - `document` (object) — full document fields (title, summary, fulltext, keywords, sectors, geographic_characterisation, implementation_years, etc. as provided by `get_documents_by_ids`), **including** optional nullable `recipe_ingredients` (JSON object) when returned by the RPC for the requested `lang`.

When `debug` is true, the response SHALL also include:

- `debug` (object) — `mode`, `min_score`, `match_threshold`, `filtered_count`, `total_before_filter`, optional RRF params, and `raw` array of per-hit debug info.

#### Scenario: Normal response

- **WHEN** a search returns 5 hits and `debug` is not set

- **THEN** the response SHALL be `{ "count": 5, "hits": [ ... ] }` with no `debug` key

#### Scenario: Document includes recipe when available

- **WHEN** `get_documents_by_ids` returns `recipe_ingredients` for a document and language

- **THEN** the corresponding `hit.document` object in the search response SHALL include the same `recipe_ingredients` value (JSON object or null)

#### Scenario: Error response

- **WHEN** the endpoint encounters an unrecoverable error (e.g. Supabase RPC failure with no fallback)

- **THEN** the endpoint SHALL respond with an appropriate HTTP error status and message

---

## ADDED Requirements

### Requirement: GET /api/document-recipe

The system SHALL provide a Nuxt server route at **`GET /api/document-recipe`** with query parameters:

| Parameter     | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `documentId`  | string | yes      | UUID of `knowledge.documents.id` |
| `lang`        | string | no       | Language code; default `en` |

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
