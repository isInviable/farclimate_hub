## Context

The `human` schema already has `profiles` and `projects` with owner-only RLS, provisioned via `packages/supabase-setup/sql/` in lexical order. The regenerable `knowledge` domain lives in `packages/db` and must not receive foreign keys from user curation data. Document identity for pins is logical (`source_document_uid`, `source_title_snapshot`) with optional `body.data` snapshots, matching `docs/DB_Arch.md`.

SQL style for new DDL should mirror `packages/db/sql/02_tables.sql` (section headers, `COMMENT ON`, indexes) for readability, while **living under `packages/supabase-setup/sql/`** because pinboards/pins are durable platform data, not pipeline-regenerable knowledge.

## Goals / Non-Goals

**Goals:**

- One pinboard per project, created automatically on `human.projects` insert.
- Pins table with extensible `body_kind` + `body` jsonb envelope `{ "v": 1, "data": { ... } }`.
- Owner-only RLS for pinboards and pins (join path: `pins` → `pinboards` → `projects.owner_user_id`).
- Storage bucket for `body_kind = image` with user-scoped object keys; copy-on-pin; delete-on-pin-delete (best-effort).
- Reproducible bootstrap via `pnpm supabase:bootstrap`.
- Automated tests that validate RLS and trigger behavior using a dedicated demo/test auth user.

**Non-Goals:**

- `human.pinboard_sections` or server-side “sections” (frontend groups by `body_kind` initially).
- `human.annotations` as a separate table in this change (`user_note` on `human.pins` only).
- Foreign keys to `knowledge.documents` or any regenerable knowledge table.
- Nuxt UI / explorer integration (separate change).

## Decisions

1. **New bootstrap file:** `packages/supabase-setup/sql/06_human_pinboards_pins.sql` (after `04_human_projects.sql`, before or alongside storage — storage policies may be `07_human_pin_storage.sql` if split). Keeps lexical ordering deterministic.

2. **1:1 pinboard ↔ project:** `human.pinboards.project_id` `UNIQUE NOT NULL` references `human.projects(id) ON DELETE CASCADE`. Trigger `human.ensure_pinboard_for_project()` **AFTER INSERT** on `human.projects` inserts one `human.pinboards` row. Alternative considered: app-only creation — rejected to avoid orphan projects without pinboards.

3. **Pins FK:** `human.pins.pinboard_id` references `human.pinboards(id) ON DELETE CASCADE`. Deleting a project cascades to pinboard and pins. **RLS:** cascaded `DELETE` on children still runs as the session user; owner `DELETE` policies on `human.pinboards` and `human.pins` MUST allow removal when the parent project is owned by `auth.uid()`, or project deletion fails mid-transaction.

4. **Nullable document fields:** `source_document_uid` and `source_title_snapshot` both nullable for project-only artifacts.

5. **`body_kind`:** `text NOT NULL`; no Postgres enum; registry and per-kind shape validation in application code. Optional future `CHECK (length(trim(body_kind)) > 0)`.

6. **`body` validation in DB (beta):** Require top-level jsonb key `v` with numeric value `1` via `CHECK` constraint if feasible in Postgres (`(body->>'v')::int = 1` and `body ? 'data'`); relax later if needed. Documents generous byte-oriented limits separately.

7. **Grants:** Same pattern as `human.projects`: `authenticated` gets CRUD on `human.pinboards` and `human.pins`; `anon`/`public` revoked; reuse existing `grant usage on schema human to authenticated` from prior scripts or re-state idempotently.

8. **PostgREST:** Schema `human` already in `pgrst.db_schemas` via `05_expose_human_schema.sql`; new tables inherit exposure once granted to `authenticated`. No change to `authenticator` role unless a new schema is added.

9. **Storage bucket name:** e.g. `human-pin-images` (exact name fixed in spec). Objects path convention: `{owner_user_id}/{pin_id}/{filename}` or `{owner_user_id}/{uuid}` to simplify RLS (“folder per user”). Policies: authenticated users can read/write only under their `auth.uid()` prefix.

10. **Image copy:** Recommended server route (service role or signed upload) copies from knowledge/public source into `human-pin-images`; pin row stores `bucket`, `object_path`, optional `caption` in `body.data`. MVP may implement route in `apps/web/server/api` or Edge Function — design allows either as long as spec scenarios hold.

11. **Tests:** Use Supabase JS + Vitest (same family as `apps/web/tests/api/*.test.ts`): seed or use env-provided `SUPABASE_URL`, service key for setup, **demo user** email/password or magic link flow to obtain user JWT, then assert select/insert/update/delete outcomes. Include: pinboard exists after project insert; owner CRUD pins; second user denied; anon denied; optional storage upload/delete happy path if env has bucket.

## Risks / Trade-offs

- **[Risk] Trigger failure leaves project without pinboard** → Mitigation: trigger is simple insert; add integration test; manual repair SQL documented in tasks.
- **[Risk] `CHECK` on jsonb `body` too strict for migration** → Mitigation: start with `v = 1` only; bump spec when adding `v = 2`.
- **[Risk] Storage orphan if pin delete fails mid-flight** → Mitigation: best-effort delete; optional periodic cleanup job later.
- **[Risk] Tests require live Supabase** → Mitigation: gate tests with `describe.skipIf(!process.env.SUPABASE_E2E_URL)` or dedicated `pnpm test:human-pins` with documented env vars.

## Migration Plan

1. Run new SQL via `pnpm supabase:bootstrap` on new environments.
2. For existing environments: run the new SQL file(s) once against the project (idempotent `IF NOT EXISTS` / `DROP POLICY IF EXISTS` patterns consistent with existing human scripts).
3. Create bucket and storage policies via SQL or dashboard; document in README.
4. Rollback: drop policies, drop bucket (after emptying objects), drop tables and trigger, drop function — script order reversed (manual).

## Open Questions

- Exact bucket name and max object size (pick concrete numbers in spec; tune post-beta).
- Whether image copy endpoint lives in Nuxt server or Supabase Edge Function (implementation choice; spec only requires behavior).

## Post-archive notes (implementation follow-up)

- **PostgREST / supabase-js:** Use `client.schema('human').from('projects' | 'pinboards' | 'pins')`. Do **not** use `from('human.projects')` — that targets `public."human.projects"` and returns **PGRST205**. Documented in `05_expose_human_schema.sql`, `packages/supabase-setup/README.md`, and **main spec** `openspec/specs/human-pinboards-pins` (requirements *Supabase client access* and *Vitest loads apps/web .env*).
- **Vitest:** `apps/web/vitest.config.ts` loads `loadEnv` from the `apps/web` directory so `apps/web/.env` supplies integration test credentials without manual shell exports.
