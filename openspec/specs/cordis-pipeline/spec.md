# cordis-pipeline

Connected Action CORDIS ingest owned by `@farclimate/cordis`. Synced from `openspec/changes/import-cordis-pipeline-package` on 2026-09-17.

## ADDED Requirements

### Requirement: CORDIS pipeline lives in a dedicated workspace package

The Hub SHALL own Connected Action CORDIS ingest in `packages/cordis` (`@farclimate/cordis`), independent of `packages/db` (`knowledge`) and `packages/supabase-setup` (auth, `human`, skills). The package SHALL expose download, parse, schema-create, upsert, and read-only audit commands.

#### Scenario: Operator can run the pipeline from the repo root

- **WHEN** the operator has installed workspace dependencies and a local `.env` with `DATABASE_URL`
- **THEN** they can run `pnpm cordis:download`, `pnpm cordis:parse`, `pnpm cordis:create`, `pnpm cordis:push`, and `pnpm cordis:audit` without using the retired `farclimate/connected` repo

#### Scenario: Knowledge pipeline is unchanged

- **WHEN** an operator runs `pnpm db:push`
- **THEN** CORDIS tables are not created, dropped, or loaded by `@farclimate/db`

### Requirement: Default source list is the 2026 Mission catalogue

The default input SHALL be a committed `data/sources.csv` copied from the old project's `dataProc/sources_2026.csv` (65 CORDIS project XML URLs). Download SHALL fetch each URL into a generated downloads directory named by CORDIS numeric id.

#### Scenario: Download covers all 65 source URLs

- **WHEN** the operator runs download against the default sources file
- **THEN** the downloads directory contains one XML file per CORDIS id in that file (65 files when all requests succeed)

#### Scenario: Missing XML is reported, not silently skipped as success

- **WHEN** a source URL fails to download or writes an empty/non-XML body
- **THEN** the download command exits non-zero and names the failing CORDIS id

### Requirement: Parse emits CSVs keyed by CORDIS ids

Parse SHALL read downloaded XML and write CSVs for projects, entities, project-entity links, CORDIS products, project-risk and project-theme links, and aux taxonomies. Project and entity identifiers in CSV SHALL be the CORDIS numeric ids (text), not UUIDs. Risks and themes SHALL continue to be derived from the existing keyword lists in the old parser (Mission catalogue legend), not from CORDIS structured fields.

#### Scenario: Parser no longer depends on `downloadsnew`

- **WHEN** XML files exist in the package downloads directory
- **THEN** parse reads that directory (not a hardcoded `downloadsnew` path) and writes CSVs to the package generated CSV directory

#### Scenario: Risks and themes are join rows, not project columns

- **WHEN** parse finishes
- **THEN** `project_risks.csv` and `project_themes.csv` exist, and project CSV does not require `risks` / `themes` text columns that the live table no longer has

### Requirement: Schema SQL matches the live UUID product model

Schema SQL SHALL create, if missing, the Connected Action tables in `public` with UUID primary keys and separate `cordis_id` text unique keys where the live database uses them, plus the product catalogue split (`products`, `products_cordis`, `products_custom`, `product_projects`, `aux_product_categories`). SQL SHALL use `CREATE TABLE IF NOT EXISTS` and SHALL NOT `DROP` existing tables.

#### Scenario: Fresh local database can be created without dropping CORDIS tables

- **WHEN** `cordis:create` runs on a database that does not yet have the CORDIS tables
- **THEN** the tables, primary keys, unique `cordis_id` constraints, and foreign keys listed in the design exist

#### Scenario: Create is safe on an existing database

- **WHEN** `cordis:create` runs on a database that already has these tables
- **THEN** existing rows are not deleted by the create command

### Requirement: Upsert load preserves UUIDs and custom products

Push SHALL upsert from CSVs using `cordis_id` as the natural key for projects, entities, and CORDIS products. Existing UUID `id` values SHALL be reused on conflict. Join tables for projects present in the current source list MAY be replaced for those projects only. Rows in `products_custom` SHALL NOT be deleted by push.

#### Scenario: Re-push keeps project UUIDs

- **WHEN** a project with `cordis_id = '101112860'` already exists with a UUID primary key and push runs again
- **THEN** that UUID is unchanged and scalar CORDIS fields are updated from XML

#### Scenario: Custom products survive a CORDIS refresh

- **WHEN** `products_custom` contains editorially added rows
- **THEN** after `cordis:push` those rows still exist

#### Scenario: Loader does not DROP tables

- **WHEN** push runs
- **THEN** it does not execute `DROP TABLE` on CORDIS or product tables

### Requirement: Public read and connected-admin write policies exist in SQL

For a greenfield database, CORDIS tables SHALL enable RLS. Anonymous and authenticated roles SHALL be able to `SELECT`. Inserts, updates, and deletes SHALL require the existing `connected_admin` JWT claim used by skills CMS. The pipeline itself SHALL connect with `DATABASE_URL` (bypasses RLS), same as `@farclimate/db`.

#### Scenario: Hub visualisations can read CORDIS tables as anon

- **WHEN** schema SQL has been applied on a fresh database
- **THEN** `anon` and `authenticated` have SELECT on the CORDIS tables used by `cordisRepository.ts`

#### Scenario: Non-admin cannot write CORDIS rows through PostgREST

- **WHEN** a baseline authenticated user (no `connected_admin` claim) calls insert on `projects_cordis` via the API
- **THEN** RLS denies the write

### Requirement: Read-only audit compares XML to the database

The package SHALL include a port of `auditXmlSupabase.js` that parses XML and compares project/entity/`cordis_id` overlap to the database. It SHALL NOT write to the database. This change SHALL NOT execute the audit against the hosted Supabase project.

#### Scenario: Audit is read-only

- **WHEN** an operator runs `cordis:audit` against a database they control
- **THEN** the command performs only SELECT (or equivalent HTTP reads) and writes a local report file; no INSERT/UPDATE/DELETE

### Requirement: Generated artifacts are not committed

Downloaded XML, generated CSVs, and audit reports SHALL be gitignored. The committed inputs SHALL be the source URL list and the pipeline code/SQL.

#### Scenario: Fresh clone can rebuild data

- **WHEN** a developer clones the Hub repo without XML files
- **THEN** they can recreate downloads and CSVs by running download then parse
