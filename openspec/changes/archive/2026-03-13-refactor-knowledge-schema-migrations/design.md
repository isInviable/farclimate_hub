## Context

The `knowledge` schema is currently built by 16 sequential SQL files (`00_create_schema.sql` through `15_add_health_impact_to_summary.sql`) executed in order by `create-tables.ts`. These files grew organically during development:

- Files 00–06: Initial schema, tables, extension, embeddings table
- File 07: `match_documents` function (semantic search)
- File 08: Retrofits `fts` tsvector column + trigger onto `fulltext` table (created in 04), includes a backfill UPDATE
- File 09: `keyword_search` function
- File 10: `hybrid_search` function
- File 11: Public wrappers + grants for PostgREST
- File 12: GIN indexes on summary array columns
- Files 13–14: Facet functions (knowledge + public wrappers)
- File 15: Retrofits `health_impact` column onto summary table (created in 02)

Since the project drops and recreates `knowledge` from scratch on each data load, there is no need to maintain incremental ALTER TABLE migrations. The files can be consolidated into a clean, logical grouping.

## Goals / Non-Goals

**Goals:**
- Reduce 16 SQL files to ~6 files grouped by logical concern
- Eliminate ALTER TABLE retrofits by inlining added columns into original CREATE TABLE statements
- Co-locate indexes with their table definitions
- Produce an **identical** final schema (tables, columns, types, indexes, functions, triggers, grants)
- Make the schema easier to read and maintain for new contributors
- Update `create-tables.ts` to match the new file list

**Non-Goals:**
- Changing any table structure, column types, or function signatures
- Adding new features or capabilities
- Modifying `push-climate-adapt.ts`, `generate-embeddings.ts`, or any frontend/API code
- Changing `drop_knowledge.sql` or `truncate_knowledge.sql` (they operate at schema/table level and are unaffected)
- Reorganising the `packages/db/src/` TypeScript files beyond updating the file list in `create-tables.ts`

## Decisions

### D1: Consolidation into 6 logical files

**Decision**: Group by logical concern rather than by chronological addition.

| New file | Content (from original files) |
|---|---|
| `01_schema_and_extensions.sql` | `00` (CREATE SCHEMA) + `05` (CREATE EXTENSION vector) |
| `02_tables.sql` | `01` (documents) + `02` (summary, **with** `health_impact` from 15) + `03` (summary_multilang) + `04` (fulltext, **with** `fts` column from 08) + `06` (embeddings) + all indexes (GIN from 12, ivfflat from 06, fts GIN from 08) |
| `03_triggers.sql` | fts trigger function + trigger (from 08), **without** the backfill UPDATE |
| `04_search_functions.sql` | `07` (match_documents) + `09` (keyword_search) + `10` (hybrid_search) |
| `05_facet_functions.sql` | `13` (get_filter_facets) + `14` (get_summary_facet_arrays) — knowledge-schema versions |
| `06_public_api.sql` | `11` (public wrappers for search + get_documents_by_ids + get_all_documents) + public wrappers from 13/14 + GRANT statements |

**Rationale**: 6 files balances readability (each file has a clear purpose) with consolidation (no ALTER TABLE hacks). Alternatives considered:
- **Single file**: Too large (~400+ lines), harder to review diffs.
- **Keep current 16**: Defeats the purpose; ALTER TABLE on fresh schema is misleading.
- **3 files (DDL / functions / grants)**: DDL file would be very long; separating triggers and functions improves clarity.

### D2: Remove backfill UPDATE statement

**Decision**: The `UPDATE knowledge.fulltext SET fulltext = fulltext;` line in `08_add_fts_column.sql` exists only to trigger the fts trigger on existing rows. On a fresh schema, there are no rows to backfill. Remove it.

**Rationale**: It's a no-op on empty tables and could be confusing. The trigger will fire naturally during data ingestion.

### D3: Index co-location with tables

**Decision**: Define indexes (GIN, ivfflat, fts GIN) in `02_tables.sql` immediately after their respective CREATE TABLE statements.

**Rationale**: Keeps each table's full definition (columns + indexes) in one place. Since we never need to add indexes independently (always fresh schema), co-location improves readability.

### D4: Preserve all SET search_path statements

**Decision**: Keep `SET search_path TO knowledge, public, extensions;` where it currently exists (embeddings, search functions). These are needed for the `vector` type resolution.

**Rationale**: Removing them would silently break vector operations. Safer to preserve even if slightly redundant.

## Risks / Trade-offs

- **[Risk] Consolidation introduces subtle schema differences** → Mitigation: Write a verification step (compare `pg_dump --schema-only` before/after) as part of the tasks. This is the primary risk.
- **[Risk] Developers familiar with old numbering get confused** → Mitigation: The old files are deleted entirely; no ambiguity about which to use. README/comments in `create-tables.ts` explain the new structure.
- **[Trade-off] Losing git blame granularity on individual migrations** → Acceptable: the project is pre-production and the original history remains in git.
