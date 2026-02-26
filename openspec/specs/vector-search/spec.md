### Requirement: Enable pgvector extension

The system SHALL enable the `vector` Postgres extension in Supabase via a SQL migration (`CREATE EXTENSION IF NOT EXISTS vector`). This SHALL be included in the schema creation SQL files and run before the embeddings table is created.

#### Scenario: Extension not yet enabled
- **WHEN** the `db:create` script runs on a fresh database
- **THEN** the `vector` extension SHALL be enabled and available for use

#### Scenario: Extension already enabled
- **WHEN** the `vector` extension is already enabled (e.g. from a previous run)
- **THEN** the migration SHALL succeed without errors (`IF NOT EXISTS`)

### Requirement: Create knowledge.embeddings table

The system SHALL create a table `knowledge.embeddings` with the following columns:
- `id` (UUID, primary key, auto-generated)
- `document_id` (UUID, foreign key to `knowledge.documents(id)`, ON DELETE CASCADE)
- `lang` (TEXT, not null)
- `content_type` (TEXT, not null) — e.g. `'composed'`, `'summary_only'`
- `model` (TEXT, not null) — the model used to generate the embedding
- `dimensions` (INTEGER, not null) — the dimensionality of the vector
- `embedding` (vector(768)) — the embedding vector

A UNIQUE constraint SHALL exist on `(document_id, lang, content_type)`.

#### Scenario: Table creation on fresh database
- **WHEN** `db:create` runs
- **THEN** the `knowledge.embeddings` table SHALL be created with all columns, constraints, and the foreign key to documents

#### Scenario: Table already exists
- **WHEN** `db:create` runs and the table already exists
- **THEN** the script SHALL succeed without errors (`IF NOT EXISTS`)

#### Scenario: Document deletion cascades
- **WHEN** a document is deleted from `knowledge.documents`
- **THEN** its corresponding rows in `knowledge.embeddings` SHALL be automatically deleted

### Requirement: Create vector similarity index

The system SHALL create an IVFFlat index on `knowledge.embeddings.embedding` using cosine distance (`vector_cosine_ops`). The index SHALL use `lists = 10` (tuned for ~200 documents).

#### Scenario: Index creation
- **WHEN** the embeddings table is created
- **THEN** an IVFFlat index SHALL exist on the `embedding` column for cosine similarity queries

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

### Requirement: Drop and truncate scripts handle embeddings

The existing `drop_knowledge.sql` SHALL continue to work (it drops the entire schema, which includes the embeddings table). The `truncate_knowledge.sql` SHALL also truncate the embeddings table since it cascades from `TRUNCATE knowledge.documents CASCADE`.

#### Scenario: Drop schema
- **WHEN** `db:drop` runs
- **THEN** the `knowledge.embeddings` table, its index, and the `match_documents` function SHALL be dropped along with the rest of the schema

#### Scenario: Truncate all data
- **WHEN** `db:truncate` runs
- **THEN** all rows in `knowledge.embeddings` SHALL be deleted (via cascade from documents)
