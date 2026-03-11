## ADDED Requirements

### Requirement: GIN indexes exist on filterable array fields
`knowledge.summary` SHALL have GIN indexes on `sectors`, `climate_impacts`, `adaptation_approaches` and `keywords` to support efficient array containment and overlap queries (`&&`, `@>`, `<@`).

#### Scenario: Indexes are present after setup
- **WHEN** the pipeline setup script runs on an empty database
- **THEN** all four GIN indexes exist on `knowledge.summary`

#### Scenario: Re-running setup on populated database is safe
- **WHEN** the pipeline setup script runs on a database that already has documents and indexes
- **THEN** the script completes without error and the existing indexes are preserved

#### Scenario: Re-running setup on already-indexed database is idempotent
- **WHEN** `CREATE INDEX IF NOT EXISTS` is executed for an index that already exists
- **THEN** no error is raised and no rebuild occurs

### Requirement: Array filter queries use index
Queries filtering on `sectors`, `climate_impacts`, `adaptation_approaches` or `keywords` with `&&` or `@>` operators SHALL use the GIN index (not a sequential scan) when the table has more than a trivial number of rows.

#### Scenario: Overlap filter uses GIN index
- **WHEN** a query contains `WHERE sectors && ARRAY['Agriculture']`
- **THEN** the query plan shows a Bitmap Index Scan on the GIN index

#### Scenario: Contains filter uses GIN index
- **WHEN** a query contains `WHERE climate_impacts @> ARRAY['Drought', 'Flooding']`
- **THEN** the query plan shows a Bitmap Index Scan on the GIN index

### Requirement: Setup script includes new SQL file
The pipeline setup entrypoint (`packages/db/src/create-tables.ts`) SHALL include `12_add_gin_indexes.sql` in the ordered list of SQL files, executed after `11_public_search_wrappers.sql`.

#### Scenario: New file runs in correct order
- **WHEN** `create-tables.ts` runs from scratch
- **THEN** `12_add_gin_indexes.sql` executes after all table creation scripts have completed
