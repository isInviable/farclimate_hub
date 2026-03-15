## Why

The `knowledge` schema is built by 16 sequential SQL migrations (00–15) that were added incrementally during development. Several later migrations patch earlier ones (e.g., `08_add_fts_column` adds a column to the table created in `04_create_fulltext`; `15_add_health_impact_to_summary` alters the table from `02_create_summary`). Since the next data load will **drop and recreate** the entire `knowledge` schema from scratch, this is the ideal moment to consolidate these migrations into a minimal, coherent set that produces the same final schema in fewer files with no ALTER TABLE retrofits.

## What Changes

- **Consolidate 16 incremental SQL files** into a reduced set (~6–8 files) grouped by logical concern rather than by chronological addition order.
- **Inline all ALTER TABLE additions** (fts column, health_impact column) into the original CREATE TABLE statements.
- **Merge index creation** (GIN indexes from `12`, FTS GIN index from `08`, ivfflat index from `06`) into the file that creates their respective table.
- **Merge search functions** (`07_match_documents_fn`, `09_keyword_search_fn`, `10_hybrid_search_fn`) into a single search-functions file.
- **Merge public wrappers and facet functions** (`11`, `13`, `14`) into a single public-API file.
- **Remove the backfill UPDATE** from `08_add_fts_column` (unnecessary on a fresh schema with no pre-existing data).
- **Update `create-tables.ts`** to reference the new consolidated file list.
- The final database state (tables, columns, indexes, functions, grants) SHALL remain **identical** to the current 16-migration result.

## Capabilities

### New Capabilities
- `consolidated-knowledge-schema`: Defines the consolidated SQL migration structure that replaces the 16 incremental files while producing an identical final schema.

### Modified Capabilities

_(No existing spec requirements change — the same tables, columns, indexes, functions, and public wrappers will exist. This is a pure implementation refactoring.)_

## Impact

- **`packages/db/sql/`**: All 16 numbered SQL files replaced by ~6–8 consolidated files with new numbering.
- **`packages/db/src/create-tables.ts`**: File list updated to reference new SQL files.
- **`packages/db/sql/drop_knowledge.sql`** and **`truncate_knowledge.sql`**: Unchanged (they operate on the schema/table level, not individual migrations).
- **No API, frontend, or pipeline changes** — the resulting schema is identical.
- **Existing specs** (`hybrid-search`, `keyword-search`, `vector-search`, `embedding-generation`, `filter-facets`, `array-field-gin-indexes`) remain satisfied — their requirements are preserved verbatim in the consolidated output.
