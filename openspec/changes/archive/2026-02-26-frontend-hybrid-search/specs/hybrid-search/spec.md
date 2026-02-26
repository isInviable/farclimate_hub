## MODIFIED Requirements

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

The function SHALL return a table with columns:
- `id` (UUID) — the document id
- `document_uid` (TEXT) — the stable document identifier
- `title` (TEXT) — the document title
- `score` (FLOAT) — the combined RRF score
- `keyword_rank` (INT) — the document's rank in keyword-only results (NULL if not found via keywords)
- `semantic_rank` (INT) — the document's rank in semantic-only results (NULL if not found via semantics)

Results SHALL be ordered by `score` descending (highest score first) and limited to `match_count` rows.

**Frontend invocation**: The web app SHALL call `hybrid_search` via a server-side API endpoint (`/api/search`), never directly from the browser. The server endpoint generates the `query_embedding` using the Gemini API and passes it to the RPC call.

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

#### Scenario: Server-side invocation from frontend
- **WHEN** a user searches from the explorer page
- **THEN** the browser SHALL call `/api/search` which generates the embedding server-side and calls `hybrid_search` via Supabase client
