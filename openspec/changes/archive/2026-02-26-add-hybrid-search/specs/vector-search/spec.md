## MODIFIED Requirements

### Requirement: Provide match_documents RPC function

The system SHALL create a Postgres function `knowledge.match_documents` that accepts:
- `query_embedding` (vector(768)) — the query embedding
- `match_count` (int, default 10) — number of results to return
- `filter_lang` (text, default 'en') — language filter
- `filter_content_type` (text, default 'composed') — content type filter

The function SHALL return a table with columns:
- `id` (UUID) — the document id
- `document_uid` (TEXT) — the stable document identifier
- `title` (TEXT) — the document title
- `similarity` (FLOAT) — cosine similarity score (1 = identical, 0 = orthogonal)

Results SHALL be ordered by similarity descending (most similar first) and limited to `match_count` rows.

**Note:** This function is unchanged. The `hybrid_search` function internally uses the same embeddings table but via its own CTE, not by calling `match_documents`. Both functions coexist independently.

#### Scenario: Basic similarity search
- **WHEN** a client calls `knowledge.match_documents` with a query embedding
- **THEN** the function SHALL return up to `match_count` documents ordered by descending cosine similarity

#### Scenario: Language-filtered search
- **WHEN** a client calls `match_documents` with `filter_lang = 'es'`
- **THEN** only embeddings where `lang = 'es'` SHALL be considered in the similarity search

#### Scenario: No matching embeddings
- **WHEN** a client calls `match_documents` but no embeddings exist for the given lang/content_type
- **THEN** the function SHALL return an empty result set

#### Scenario: Supabase RPC invocation
- **WHEN** the web app calls `supabase.rpc('match_documents', { query_embedding, match_count: 5 })`
- **THEN** the function SHALL be accessible and return correctly typed results
