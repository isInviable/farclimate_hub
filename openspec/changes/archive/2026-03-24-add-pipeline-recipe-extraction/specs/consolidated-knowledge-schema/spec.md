# Consolidated knowledge schema (delta)

---

## MODIFIED Requirements

### Requirement: Consolidated SQL migration files produce identical schema

The `packages/db/sql/` directory SHALL contain exactly 6 numbered SQL files that, when executed in order, produce a `knowledge` schema identical to the one produced by the previous 16 sequential migrations. The files SHALL be:

1. `01_schema_and_extensions.sql` — schema creation and pgvector extension
2. `02_tables.sql` — all tables with final column definitions and all indexes
3. `03_triggers.sql` — trigger functions and triggers
4. `04_search_functions.sql` — all knowledge-schema search functions
5. `05_facet_functions.sql` — all knowledge-schema facet functions
6. `06_public_api.sql` — public wrapper functions and GRANT statements

#### Scenario: Fresh database setup produces correct tables

- **WHEN** `db:create` runs the 6 consolidated SQL files on a fresh database with no `knowledge` schema

- **THEN** the resulting schema SHALL contain exactly the tables `knowledge.documents`, `knowledge.summary`, `knowledge.summary_multilang`, `knowledge.fulltext`, `knowledge.embeddings`, and `knowledge.recipe` with all columns matching the current production schema (including `health_impact` on summary, `fts` on fulltext, and `ingredients` JSONB on recipe)

#### Scenario: Fresh database setup produces correct indexes

- **WHEN** `db:create` completes on a fresh database

- **THEN** the schema SHALL have: GIN indexes on `summary.sectors`, `summary.climate_impacts`, `summary.adaptation_approaches`, `summary.keywords`; a GIN index on `fulltext.fts`; an ivfflat index on `embeddings.embedding`; and a unique index on `(document_id, lang)` for `knowledge.recipe`

#### Scenario: Fresh database setup produces correct functions

- **WHEN** `db:create` completes on a fresh database

- **THEN** the schema SHALL have functions: `knowledge.match_documents`, `knowledge.keyword_search`, `knowledge.hybrid_search`, `knowledge.get_filter_facets`, `knowledge.get_summary_facet_arrays`, and `knowledge.fulltext_fts_trigger`; plus public wrappers: `public.hybrid_search`, `public.keyword_search`, `public.get_all_documents`, `public.get_documents_by_ids`, `public.get_filter_facets`, `public.get_summary_facet_arrays`

#### Scenario: GRANT statements are preserved

- **WHEN** `db:create` completes

- **THEN** the `anon` and `authenticated` roles SHALL have USAGE on `knowledge` schema and SELECT on all tables, with default privileges set for future tables
