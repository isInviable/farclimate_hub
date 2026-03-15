## 1. Create consolidated SQL files

- [x] 1.1 Create `01_schema_and_extensions.sql` combining schema creation (from `00`) and pgvector extension (from `05`)
- [x] 1.2 Create `02_tables.sql` with all five tables in final form: `documents`, `summary` (with `health_impact`), `summary_multilang`, `fulltext` (with `fts` column), `embeddings`; include all indexes (GIN on summary arrays, GIN on fts, ivfflat on embeddings) inline after each table
- [x] 1.3 Create `03_triggers.sql` with the `fulltext_fts_trigger` function and the `fulltext_fts_update` trigger (without the backfill UPDATE)
- [x] 1.4 Create `04_search_functions.sql` combining `match_documents`, `keyword_search`, and `hybrid_search` functions
- [x] 1.5 Create `05_facet_functions.sql` combining `get_filter_facets` and `get_summary_facet_arrays` (knowledge-schema versions only)
- [x] 1.6 Create `06_public_api.sql` with all public wrapper functions (`hybrid_search`, `keyword_search`, `get_all_documents`, `get_documents_by_ids`, `get_filter_facets`, `get_summary_facet_arrays`) and GRANT statements

## 2. Remove old migration files

- [x] 2.1 Delete the 16 original numbered files: `00_create_schema.sql` through `15_add_health_impact_to_summary.sql`
- [x] 2.2 Verify `drop_knowledge.sql` and `truncate_knowledge.sql` remain unchanged

## 3. Update TypeScript orchestration

- [x] 3.1 Update `packages/db/src/create-tables.ts` to reference the 6 new consolidated file names in order

## 4. Verification

- [x] 4.1 Run `db:drop` followed by `db:create` on the development database and confirm no errors
- [ ] 4.2 Run `db:push` (data ingestion) and confirm documents, summaries, fulltext, and embeddings are populated correctly
- [ ] 4.3 Verify search functions work: test `hybrid_search`, `keyword_search`, `get_all_documents`, `get_documents_by_ids` via Supabase client or SQL
- [ ] 4.4 Verify facet functions work: test `get_filter_facets` and `get_summary_facet_arrays` return expected structure
