## MODIFIED Requirements

### Requirement: Consolidated SQL migration files produce identical schema

The `packages/db/sql/` directory SHALL contain exactly 6 numbered SQL files that, when executed in order, produce a `knowledge` schema with the tables, indexes, and functions described by the remaining requirements in this spec. The files SHALL be:

1. `01_schema_and_extensions.sql` — schema creation and pgvector extension
2. `02_tables.sql` — all tables with final column definitions and all indexes
3. `03_triggers.sql` — trigger functions and triggers
4. `04_search_functions.sql` — all knowledge-schema search functions
5. `05_facet_functions.sql` — all knowledge-schema facet functions
6. `06_public_api.sql` — public wrapper functions and GRANT statements

#### Scenario: Fresh database setup produces correct tables
- **WHEN** `db:create` runs the 6 consolidated SQL files on a fresh database with no `knowledge` schema
- **THEN** the resulting schema SHALL contain exactly the tables `knowledge.documents`, `knowledge.summary`, `knowledge.summary_multilang`, `knowledge.fulltext`, `knowledge.embeddings`, `knowledge.recipe`, and `knowledge.document_images`, and `knowledge.documents` SHALL NOT have an `image_url` column

#### Scenario: Fresh database setup produces correct indexes
- **WHEN** `db:create` completes on a fresh database
- **THEN** the schema SHALL have: GIN indexes on `summary.sectors`, `summary.climate_impacts`, `summary.adaptation_approaches`, `summary.keywords`; a GIN index on `fulltext.fts`; an ivfflat index on `embeddings.embedding`; a unique constraint on `(document_id, lang)` for `knowledge.recipe`; a unique constraint on `(document_id, position)` for `knowledge.document_images`; and a composite index on `knowledge.document_images (document_id, position)`

#### Scenario: Fresh database setup produces correct functions
- **WHEN** `db:create` completes on a fresh database
- **THEN** the schema SHALL have functions: `knowledge.match_documents`, `knowledge.keyword_search`, `knowledge.hybrid_search`, `knowledge.get_filter_facets`, `knowledge.get_summary_facet_arrays`, and `knowledge.fulltext_fts_trigger`; plus public wrappers: `public.hybrid_search`, `public.keyword_search`, `public.get_all_documents`, `public.get_documents_by_ids`, `public.get_document_by_uid`, `public.get_filter_facets`, `public.get_summary_facet_arrays`

#### Scenario: GRANT statements are preserved
- **WHEN** `db:create` completes
- **THEN** the `anon` and `authenticated` roles SHALL have USAGE on `knowledge` schema and SELECT on all tables (including `knowledge.document_images`), with default privileges set for future tables

### Requirement: Function signatures remain unchanged

All function signatures (parameter names, types, defaults, return types) SHALL be identical to the current versions **except** that (a) `public.get_all_documents`, `public.get_documents_by_ids`, and `public.get_document_by_uid` MAY be extended with the nullable return column `recipe_ingredients jsonb` sourced from `knowledge.recipe.ingredients` for `filter_lang`, and (b) the same three functions SHALL replace the previous `image_url text` return column with a new `images jsonb` return column built as an ordered `jsonb_agg` over `knowledge.document_images` rows for the document. `images` SHALL be `'[]'::jsonb` (never NULL) when the document has no image rows. All other functions listed in this spec (including `knowledge.hybrid_search`, `public.hybrid_search`, `public.keyword_search`, etc.) SHALL keep their parameter lists and return column sets unchanged.

#### Scenario: hybrid_search signature unchanged
- **WHEN** `knowledge.hybrid_search` is called with the same parameters as before
- **THEN** it SHALL return the same column set (`id`, `document_uid`, `title`, `score`, `keyword_rank`, `semantic_rank`) with the same types

#### Scenario: public.hybrid_search wrapper unchanged
- **WHEN** `public.hybrid_search` is called via PostgREST with a text embedding parameter
- **THEN** it SHALL cast to `vector(768)` and delegate to `knowledge.hybrid_search` exactly as before

#### Scenario: get_documents_by_ids exposes recipe_ingredients
- **WHEN** `public.get_documents_by_ids` is invoked with a language for which a `knowledge.recipe` row exists
- **THEN** each returned row SHALL include `recipe_ingredients` equal to that row's `ingredients` object, or NULL when no recipe exists for that `(document_id, lang)`

#### Scenario: get_all_documents returns images array instead of image_url
- **WHEN** `public.get_all_documents` is invoked
- **THEN** each returned row SHALL include an `images jsonb` column ordered by `position` ascending and SHALL NOT include an `image_url` column

#### Scenario: get_document_by_uid returns images for a pictureless document
- **WHEN** `public.get_document_by_uid` is invoked for a document with no rows in `knowledge.document_images`
- **THEN** the returned `images` column SHALL equal `'[]'::jsonb`
