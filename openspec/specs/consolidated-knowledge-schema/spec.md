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
- **THEN** the schema SHALL have: GIN indexes on `summary.sectors`, `summary.climate_impacts`, `summary.adaptation_approaches`, `summary.keywords`; a GIN index on `fulltext.fts`; an ivfflat index on `embeddings.embedding`; and a unique constraint on `(document_id, lang)` for `knowledge.recipe`

#### Scenario: Fresh database setup produces correct functions
- **WHEN** `db:create` completes on a fresh database
- **THEN** the schema SHALL have functions: `knowledge.match_documents`, `knowledge.keyword_search`, `knowledge.hybrid_search`, `knowledge.get_filter_facets`, `knowledge.get_summary_facet_arrays`, and `knowledge.fulltext_fts_trigger`; plus public wrappers: `public.hybrid_search`, `public.keyword_search`, `public.get_all_documents`, `public.get_documents_by_ids`, `public.get_filter_facets`, `public.get_summary_facet_arrays`

#### Scenario: GRANT statements are preserved
- **WHEN** `db:create` completes
- **THEN** the `anon` and `authenticated` roles SHALL have USAGE on `knowledge` schema and SELECT on all tables, with default privileges set for future tables

### Requirement: Old migration files are removed

All 16 original numbered SQL files (`00_create_schema.sql` through `15_add_health_impact_to_summary.sql`) SHALL be deleted from `packages/db/sql/`. The utility files `drop_knowledge.sql` and `truncate_knowledge.sql` SHALL remain unchanged.

#### Scenario: No stale migration files remain
- **WHEN** the refactoring is complete
- **THEN** `packages/db/sql/` SHALL contain exactly 8 files: the 6 new consolidated files plus `drop_knowledge.sql` and `truncate_knowledge.sql`

### Requirement: create-tables.ts references consolidated files

The `packages/db/src/create-tables.ts` file SHALL be updated to list the 6 new consolidated SQL files in order, replacing the previous 16-file list.

#### Scenario: create-tables.ts runs successfully
- **WHEN** `npm run db:create` (or equivalent) is executed
- **THEN** it SHALL execute the 6 files in order (01 through 06) without errors

#### Scenario: Idempotent execution
- **WHEN** `db:create` is run twice consecutively
- **THEN** the second run SHALL succeed without errors (all statements use IF NOT EXISTS / CREATE OR REPLACE)

### Requirement: No backfill UPDATE on fresh schema

The consolidated migration files SHALL NOT contain any `UPDATE` statements intended to backfill existing data (such as `UPDATE knowledge.fulltext SET fulltext = fulltext`). The fts trigger SHALL fire naturally during data ingestion.

#### Scenario: Trigger populates fts on insert
- **WHEN** a row is inserted into `knowledge.fulltext` with a non-empty `fulltext` value and `lang = 'en'`
- **THEN** the `fts` column SHALL be automatically populated by the trigger using the `english` tsvector configuration

### Requirement: Function signatures remain unchanged

All function signatures (parameter names, types, defaults, return types) SHALL be identical to the current versions **except** that `public.get_all_documents` and `public.get_documents_by_ids` MAY be extended with an additional nullable return column `recipe_ingredients jsonb` sourced from `knowledge.recipe.ingredients` for `filter_lang`. All other functions listed in this spec (including `knowledge.hybrid_search`, `public.hybrid_search`, `public.keyword_search`, etc.) SHALL keep their parameter lists and return column sets unchanged.

#### Scenario: hybrid_search signature unchanged
- **WHEN** `knowledge.hybrid_search` is called with the same parameters as before
- **THEN** it SHALL return the same column set (`id`, `document_uid`, `title`, `score`, `keyword_rank`, `semantic_rank`) with the same types

#### Scenario: public.hybrid_search wrapper unchanged
- **WHEN** `public.hybrid_search` is called via PostgREST with a text embedding parameter
- **THEN** it SHALL cast to `vector(768)` and delegate to `knowledge.hybrid_search` exactly as before

#### Scenario: get_documents_by_ids exposes recipe_ingredients
- **WHEN** `public.get_documents_by_ids` is invoked with a language for which a `knowledge.recipe` row exists
- **THEN** each returned row SHALL include `recipe_ingredients` equal to that row’s `ingredients` object, or NULL when no recipe exists for that `(document_id, lang)`
