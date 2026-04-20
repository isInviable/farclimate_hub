# human-pinboards-pins Specification

## Purpose

Project pinboards and pins in `human`: one pinboard per project (trigger), owner-only RLS, logical `source_document_uid` / title snapshot, `body` envelope `v=1`, no FK to `knowledge`. Clients and tests MUST use PostgREST’s explicit schema API (see **Supabase client access** below).

## Requirements
### Requirement: Pinboard and pin SQL is bootstrap reproducible
The system SHALL provision `human.pinboards` and `human.pins` (including trigger function, RLS policies, grants, and indexes) through `packages/supabase-setup` ordered SQL, using the same idempotent patterns as existing human bootstrap scripts.

#### Scenario: Bootstrap applies pinboard and pin DDL
- **WHEN** operators run `pnpm supabase:bootstrap` on a new Supabase project
- **THEN** the pipeline MUST execute the new human pin SQL step(s) after `human.projects` and create `human.pinboards`, `human.pins`, the project-insert trigger, and owner-only policies

#### Scenario: Setup documentation mentions pinboards and pins
- **WHEN** engineers read `packages/supabase-setup/README.md`
- **THEN** it MUST list the new SQL step(s) and summarize pinboard auto-creation and RLS ownership rules

### Requirement: One pinboard per project with automatic creation
The system SHALL define `human.pinboards` with columns `id` (uuid PK), `project_id` (uuid NOT NULL UNIQUE referencing `human.projects(id) ON DELETE CASCADE`), `created_at`, `updated_at`. Exactly one pinboard row MUST exist for each project row, created by a trigger on `human.projects` insert.

#### Scenario: New project receives a pinboard automatically
- **WHEN** an authenticated user inserts a row into `human.projects`
- **THEN** the system MUST insert exactly one `human.pinboards` row with `project_id` equal to that project’s `id`

#### Scenario: Project deletion removes its pinboard
- **WHEN** a project row is deleted
- **THEN** its `human.pinboards` row MUST be deleted by referential cascade

### Requirement: Pins store logical document fields and extensible body
The system SHALL define `human.pins` with columns: `id` (uuid PK), `pinboard_id` (uuid NOT NULL referencing `human.pinboards(id) ON DELETE CASCADE`), `source_document_uid` (text, nullable), `source_title_snapshot` (text, nullable), `body_kind` (text NOT NULL), `body` (jsonb NOT NULL), `user_note` (text, nullable), `sort_order` (integer NOT NULL default 0), `created_at`, `updated_at`. The system MUST NOT declare foreign keys from `human.pins` to any `knowledge` schema table.

#### Scenario: Pin without knowledge document
- **WHEN** a pin is inserted with `source_document_uid` and `source_title_snapshot` both null
- **THEN** the insert MUST succeed if other constraints are satisfied

#### Scenario: Pin with logical document reference only
- **WHEN** a pin is inserted with `source_document_uid` and optional `source_title_snapshot` set
- **THEN** the insert MUST succeed without requiring a matching `knowledge.documents` row

#### Scenario: Pinboard deletion removes pins
- **WHEN** a `human.pinboards` row is deleted
- **THEN** all `human.pins` rows with that `pinboard_id` MUST be deleted by cascade

### Requirement: Body envelope version 1
The system SHALL require every `human.pins.body` value to be a JSON object containing integer `v` equal to 1 and a `data` object (possibly empty), i.e. `{"v":1,"data":{...}}` semantics. Enforcement MAY use a database `CHECK` constraint and MUST be documented for application validators.

#### Scenario: Insert pin with valid body envelope
- **WHEN** a pin is inserted with `body` containing `"v": 1` and a `data` object
- **THEN** the insert MUST succeed

#### Scenario: Insert pin with invalid body version
- **WHEN** a pin is inserted with `body` missing `v`, or with `v` not equal to 1
- **THEN** the insert MUST be rejected by the database constraint or documented application validation (beta: primary enforcement in DB if constraint exists)

### Requirement: Open body_kind registry
The system SHALL store `body_kind` as free text without a Postgres enum. Allowed values and per-kind `data` shapes SHALL be validated in application code. The database SHALL still require `body_kind` to be non-empty after trim.

#### Scenario: New body_kind without migration
- **WHEN** application code introduces a new `body_kind` string and valid `body.data` for `v` = 1
- **THEN** inserts MUST succeed without altering Postgres enums (subject to RLS and body envelope rules)

### Requirement: Beta limits for pins
The system SHALL document generous beta limits: `body` jsonb effective payload not exceeding 512 KiB per row; not more than 10 000 pins per `pinboard_id`; `body_kind` length not exceeding 128 characters. Enforcement MAY be application-side for pin count; jsonb size MAY use a CHECK using `octet_length(body::text)` or equivalent with a documented cap. Limits SHALL be treated as tunable post-beta.

#### Scenario: Typical pin under limits
- **WHEN** a pin insert respects the documented size and `body_kind` length limits
- **THEN** the insert MUST not be rejected solely for limit reasons

### Requirement: Owner-only RLS for pinboards
The system SHALL enable RLS on `human.pinboards` and allow `select`, `insert`, `update`, and `delete` only when the related project’s `owner_user_id` equals `auth.uid()` (verified via join or subquery on `human.projects`). The trigger-created row MUST satisfy the same ownership as the inserting user. `INSERT` MUST be permitted for the project owner so the `AFTER INSERT` trigger on `human.projects` can create the pinboard under RLS; direct duplicate inserts MUST fail on `UNIQUE(project_id)`.

#### Scenario: Owner reads own pinboard
- **WHEN** an authenticated user selects `human.pinboards` for a project they own
- **THEN** the row MUST be returned

#### Scenario: User cannot read another user’s pinboard
- **WHEN** an authenticated user selects a `human.pinboards` row tied to another user’s project
- **THEN** the read MUST return no row (policy denied)

#### Scenario: Project delete cascades under RLS
- **WHEN** an authenticated owner deletes their `human.projects` row and `ON DELETE CASCADE` removes dependent `human.pinboards` and `human.pins` rows
- **THEN** policies MUST allow those cascaded deletes for the same session user (owner) so the operation succeeds

### Requirement: Owner-only RLS for pins
The system SHALL enable RLS on `human.pins` and allow `select`, `insert`, `update`, `delete` only when the pin’s `pinboard_id` belongs to a project with `owner_user_id = auth.uid()`.

#### Scenario: Owner CRUD on own pins
- **WHEN** an authenticated owner inserts, updates, selects, or deletes pins under their pinboard
- **THEN** the operation MUST succeed

#### Scenario: Non-owner cannot mutate pins
- **WHEN** an authenticated user attempts to insert, update, or delete a pin under another user’s pinboard
- **THEN** the operation MUST be denied by policy

#### Scenario: Non-owner cannot read pins
- **WHEN** an authenticated user attempts to select another user’s pins
- **THEN** no rows MUST be returned

### Requirement: Anon has no access to pinboards or pins
The system SHALL deny `anon` and unauthenticated roles from `select`, `insert`, `update`, and `delete` on `human.pinboards` and `human.pins`, consistent with `human.projects` access.

#### Scenario: Anon cannot read pins
- **WHEN** an `anon` client queries `human.pins` or `human.pinboards`
- **THEN** access MUST be denied by policy or grants

### Requirement: Automated backend tests for pinboards and pins
The system SHALL include automated tests that run against a Supabase instance (local or CI with secrets) using an authenticated **demo/test user** JWT, covering: project insert creates pinboard; owner can CRUD pins; second authenticated user cannot read or mutate the first user’s pins; `anon` key cannot read pins. Tests MAY be skipped when required env vars are absent, with documented variable names.

#### Scenario: Demo user owns pin lifecycle
- **WHEN** tests run with valid Supabase URL and demo user credentials
- **WHEN** the demo user creates a project and pins
- **THEN** tests MUST pass for create, read, update, delete on that user’s data

#### Scenario: Cross-user isolation is verified
- **WHEN** tests run with two distinct authenticated users
- **THEN** user B MUST be unable to select or mutate user A’s pins

#### Scenario: Anon isolation is verified
- **WHEN** tests use the public `anon` key without user JWT
- **THEN** reads and writes to `human.pins` MUST fail as expected by RLS

### Requirement: Supabase client access uses explicit human schema
Application code, composables, and integration tests that query `human` tables through the Supabase JavaScript client SHALL call `client.schema('human').from('<table_name>')` (e.g. `.schema('human').from('pins')`). They SHALL NOT use `client.from('human.<table_name>')`, because PostgREST treats that as a single table identifier in schema `public`, which yields **PGRST205** / schema cache errors (“Could not find the table `public.human.projects`”).

#### Scenario: Bootstrap documentation warns implementers
- **WHEN** engineers read `packages/supabase-setup/sql/05_expose_human_schema.sql` or the `05_expose_human_schema` section in `packages/supabase-setup/README.md`
- **THEN** the correct `.schema('human')` pattern and the forbidden dotted `.from('human.*')` pattern MUST be documented

#### Scenario: Human pins integration tests follow the same pattern as the app
- **WHEN** Vitest integration tests in `apps/web/tests/human/` access `human.pinboards` or `human.pins`
- **THEN** they MUST use the explicit schema chain so requests match production composables (e.g. `useProjectsSupabase`)

### Requirement: Vitest loads apps/web `.env` for integration tests
The `apps/web` Vitest configuration SHALL merge Vite `loadEnv` output from the `apps/web` directory into `process.env` (and `test.env`) so variables such as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_TEST_EMAIL`, and `SUPABASE_TEST_PASSWORD` are available when running `pnpm --filter web test` without requiring a separate shell `export`.

#### Scenario: Local run with `.env` present
- **WHEN** required test variables exist in `apps/web/.env` and the operator runs `pnpm --filter web test:human-pins`
- **THEN** the human pinboards/pins integration suite MUST observe those values in `process.env` and execute (not skip solely for missing env)

