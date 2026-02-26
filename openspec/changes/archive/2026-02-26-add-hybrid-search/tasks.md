## 1. Full-Text Search Infrastructure

- [x] 1.1 Create `packages/db/sql/08_add_fts_column.sql` — add `fts tsvector` column to `knowledge.fulltext` (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS fts tsvector`)
- [x] 1.2 In the same file, create trigger function `knowledge.fulltext_fts_trigger()` that maps `lang` to text search config (`en`→`english`, `es`→`spanish`, else→`simple`) and computes `NEW.fts = to_tsvector(config, NEW.fulltext)`, setting NULL when fulltext is empty/null
- [x] 1.3 In the same file, create trigger `fulltext_fts_update` BEFORE INSERT OR UPDATE on `knowledge.fulltext` that calls the trigger function
- [x] 1.4 In the same file, create GIN index: `CREATE INDEX IF NOT EXISTS fulltext_fts_idx ON knowledge.fulltext USING gin(fts)`
- [x] 1.5 In the same file, backfill existing rows: `UPDATE knowledge.fulltext SET fulltext = fulltext` (triggers recomputation of fts for all existing rows)

## 2. Keyword Search Function

- [x] 2.1 Create `packages/db/sql/09_keyword_search_fn.sql` — `knowledge.keyword_search(query_text, match_count, filter_lang)` that uses `websearch_to_tsquery` + `ts_rank_cd` to search `knowledge.fulltext.fts`, joins with `knowledge.documents`, and returns `(id, document_uid, title, rank)` ordered by rank desc

## 3. Hybrid Search Function

- [x] 3.1 Create `packages/db/sql/10_hybrid_search_fn.sql` — `knowledge.hybrid_search(query_text, query_embedding, match_count, filter_lang, filter_content_type, full_text_weight, semantic_weight, rrf_k)` that:
  - CTE `full_text`: keyword search on `knowledge.fulltext` with `row_number()` rank
  - CTE `semantic`: embedding cosine distance on `knowledge.embeddings` with `row_number()` rank
  - FULL OUTER JOIN on `document_id`, compute RRF score, join `knowledge.documents` for metadata
  - Return `(id, document_uid, title, score, keyword_rank, semantic_rank)` ordered by score desc

## 4. Update Create-Tables Script

- [x] 4.1 Update `packages/db/src/create-tables.ts` to include `08_add_fts_column.sql`, `09_keyword_search_fn.sql`, `10_hybrid_search_fn.sql` in the execution order

## 5. Apply Migration to Live Database

- [x] 5.1 Apply the new SQL migrations to the live Supabase database (via MCP `apply_migration` or `db:create`)
- [x] 5.2 Verify the fts column is populated for all existing rows: `SELECT count(*) FROM knowledge.fulltext WHERE fts IS NOT NULL`

## 6. Verification

- [x] 6.1 Test `keyword_search`: call with a known term (e.g. 'flood') and verify results are returned with correct rank ordering
- [x] 6.2 Test `hybrid_search`: call with both query text and an embedding vector and verify the RRF fusion produces combined results from both methods
- [x] 6.3 Test `hybrid_search` with skewed weights: `full_text_weight=2, semantic_weight=0` should match keyword_search results; `full_text_weight=0, semantic_weight=2` should match match_documents results
- [x] 6.4 Verify `db:push` still works correctly (trigger auto-computes fts on upsert, no push script changes needed)
- [x] 6.5 Verify `db:drop` and `db:truncate` correctly clean up all new artifacts (trigger, function, index, column — all dropped with schema cascade)
