### Requirement: Provide hybrid_search RPC function

The system SHALL create a Postgres function `knowledge.hybrid_search` that combines keyword search and semantic search using Reciprocal Ranked Fusion (RRF).

The function SHALL accept:
- `query_text` (text) — the user's search string for keyword matching
- `query_embedding` (vector(768)) — the embedding vector of the user's query for semantic matching
- `match_count` (int, default 10) — number of results to return
- `filter_lang` (text, default 'en') — language filter applied to both searches
- `filter_content_type` (text, default 'composed') — content type filter for semantic search
- `full_text_weight` (float, default 1) — weight multiplier for the keyword search rank
- `semantic_weight` (float, default 1) — weight multiplier for the semantic search rank
- `rrf_k` (int, default 50) — RRF smoothing constant added to the denominator
- `match_threshold` (float, default 0.0) — minimum cosine similarity for the semantic branch; when > 0, the semantic CTE SHALL exclude rows where `embedding <=> query_embedding >= 1.0 - match_threshold` (same pattern as [Supabase match_documents](https://supabase.com/docs/guides/ai/semantic-search))

The function SHALL return a table with columns:
- `id` (UUID) — the document id
- `document_uid` (TEXT) — the stable document identifier
- `title` (TEXT) — the document title
- `score` (FLOAT) — the combined RRF score
- `keyword_rank` (INT) — the document's rank in keyword-only results (NULL if not found via keywords)
- `semantic_rank` (INT) — the document's rank in semantic-only results (NULL if not found via semantics)

Results SHALL be ordered by `score` descending (highest score first) and limited to `match_count` rows.

#### Scenario: Both methods find results
- **WHEN** a query matches documents via both keyword search and semantic search
- **THEN** documents appearing in both lists SHALL receive higher RRF scores than those in only one list

#### Scenario: Keyword-only match
- **WHEN** a document matches the keyword query but is not in the top semantic results
- **THEN** it SHALL still appear in results with `semantic_rank = NULL` and a score based only on keyword rank

#### Scenario: Semantic-only match
- **WHEN** a document matches via semantic search but not keyword search
- **THEN** it SHALL still appear in results with `keyword_rank = NULL` and a score based only on semantic rank

#### Scenario: Weight tuning
- **WHEN** `full_text_weight = 2` and `semantic_weight = 1`
- **THEN** keyword matches SHALL contribute twice as much to the final score as semantic matches

#### Scenario: Empty keyword query
- **WHEN** `query_text` is empty or NULL
- **THEN** the function SHALL return results ranked by semantic search only (keyword contribution is zero)

#### Scenario: Language filter
- **WHEN** `filter_lang = 'es'`
- **THEN** keyword search SHALL query Spanish tsvectors and semantic search SHALL query Spanish embeddings

#### Scenario: Supabase RPC invocation
- **WHEN** the web app calls `supabase.rpc('hybrid_search', { query_text: 'flood', query_embedding: [...], match_count: 10 })`
- **THEN** the function SHALL be accessible and return correctly typed results

#### Scenario: Semantic similarity threshold (match_threshold > 0)
- **WHEN** `match_threshold` is set to a value in (0, 1] (e.g. 0.3)
- **THEN** the semantic CTE SHALL include only embeddings whose cosine distance to the query embedding is less than `1.0 - match_threshold` (i.e. cosine similarity ≥ match_threshold); documents excluded by this filter SHALL NOT appear in the semantic result set and thus contribute only via keyword rank if present

#### Scenario: No semantic threshold (match_threshold <= 0)
- **WHEN** `match_threshold` is 0 or negative
- **THEN** the semantic CTE SHALL NOT filter by distance; all documents matching `filter_lang` and `filter_content_type` SHALL be considered, ordered by distance, up to the CTE limit

### Requirement: RRF scoring formula

The RRF score for each document SHALL be calculated as:

`score = coalesce(1.0 / (rrf_k + keyword_rank), 0.0) * full_text_weight + coalesce(1.0 / (rrf_k + semantic_rank), 0.0) * semantic_weight`

Where `keyword_rank` and `semantic_rank` are the document's position (1-based) in their respective result lists, ordered by relevance.

#### Scenario: Document ranked 1st in both lists (k=50)
- **WHEN** a document is ranked 1st in keyword search and 1st in semantic search with default weights and k=50
- **THEN** its score SHALL be `1/(50+1) + 1/(50+1) = 0.0392`

#### Scenario: Document ranked 1st in keywords, absent from semantic
- **WHEN** a document is ranked 1st in keyword search but absent from semantic search
- **THEN** its score SHALL be `1/(50+1) + 0 = 0.0196`

### Requirement: Drop and truncate handle hybrid search artifacts

The existing `drop_knowledge.sql` (DROP SCHEMA CASCADE) SHALL automatically drop the `hybrid_search` function, `keyword_search` function, the `fts` column, the GIN index, and the trigger. The `truncate_knowledge.sql` (TRUNCATE documents CASCADE) SHALL clear the tsvector data along with the fulltext rows.

#### Scenario: Drop schema
- **WHEN** `db:drop` runs
- **THEN** all hybrid search artifacts SHALL be dropped with the schema

#### Scenario: Truncate data
- **WHEN** `db:truncate` runs
- **THEN** all fulltext rows (and their tsvectors) SHALL be cleared via cascade
