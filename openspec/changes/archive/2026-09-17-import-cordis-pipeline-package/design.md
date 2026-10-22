## Context

The Hub already renders Connected Action from live `public` CORDIS tables via `apps/web/app/utils/cordisRepository.ts`. Those tables were created and first loaded in `farclimate/connected/dataProc` (T6.5), then evolved in Supabase (UUID `id` + `cordis_id`, product catalogue split). This repo never received that pipeline.

Old scripts to port (from `farclimate/connected/dataProc/`):

| Old file | Fate |
|---|---|
| `download_xml.sh` | Port to TS; write `data/downloads/<id>.xml` |
| `parse.js` | Port to TS; read `data/downloads` (not `downloadsnew`) |
| `loadSupabase.js` | Replace: no DROP; UUID upsert; product split |
| `auditXmlSupabase.js` | Port as read-only audit; **do not run against hosted Supabase in this change** |
| `sources_2026.csv` | Becomes default `data/sources.csv` (65 URLs) |
| `sources.csv` (46) | Not the default; keep only as a comment in README that production was loaded from the 2025 list |
| `loadSqlite.js` | **Leave behind** (user decision) |

Already in this Hub (do not copy): Connected pages, admin CRUD, NUTS/europe geo JSON, `connected_admin` RBAC, skills CMS.

## Goals / Non-Goals

**Goals:**

- One package an operator can use after `connected` is deleted.
- Schema SQL that matches the **known live shape** (UUID PKs, `cordis_id`, product split) using `CREATE TABLE IF NOT EXISTS`.
- Upsert load that is safe to re-run without wiping `products_custom` or rotating Hub UUIDs.
- Default ingest of the **65-project 2026 catalogue**.
- Documented commands; Climate-ADAPT and CORDIS pipelines stay separate.

**Non-Goals:**

- Running `create` / `push` / `audit` against the hosted Supabase project in this change.
- Importing Nuxt UI, Nitro APIs, or geo assets.
- Porting SQLite.
- Changing Hub visualisations or admin forms.
- Automatically switching production from 46 to 65 projects (that is a later operator run).
- Scraping or regenerating the Mission catalogue PDF; the URL list is the committed input.

## Decisions

### 1. Package layout

**Choice:** `packages/cordis` named `@farclimate/cordis`, TypeScript + `tsx`, same `DATABASE_URL` loading as `packages/db` (workspace-root `.env`).

```
packages/cordis/
  package.json
  README.md
  sql/01_tables.sql
  sql/02_rls.sql
  src/config.ts
  src/run-sql.ts
  src/create-tables.ts
  src/download-xml.ts
  src/parse-xml.ts
  src/push-cordis.ts
  src/audit-xml.ts
  data/sources.csv          # committed, 65 URLs
  data/downloads/           # gitignored
  data/csv/                 # gitignored
  data/audit_output/        # gitignored
```

**Alternative:** dump scripts under `pipeline/` next to Climate-ADAPT Python — rejected; CORDIS is Node/SQL like `packages/db`, and a package keeps schema + load together.

### 2. Source list

**Choice:** Copy `sources_2026.csv` to `data/sources.csv` as the only default list (65 rows + header). Download from CORDIS during implementation is allowed (public HTTP). Missing 19 XMLs are expected until download runs.

**Alternative:** Keep both 2025 and 2026 files as first-class inputs — rejected as operator confusion; README can mention the 2025 snapshot historically.

### 3. Schema = live model, not old `loadSupabase.js`

Do **not** recreate TEXT PKs equal to CORDIS ids. Target tables (already observed in production):

**Core CORDIS**

- `projects_cordis` — `id uuid PK`, unique `cordis_id text`, acronym, teaser, title, keywords, costs, dates, duration
- `entities_cordis` — `id uuid PK`, unique `cordis_id text`, address/*, region/*, `organization_activity_type_id` FK → `aux_entity_types`
- `project_entities` — PK `(project_id, entity_id)`, FKs to the two tables above, type/order/funding/sme/terminated
- `project_risks` / `project_themes` — composite PKs, FKs to projects + aux tables
- `aux_climate_risks`, `aux_themes`, `aux_entity_types`

**Product catalogue (post-XML evolution)**

- `aux_product_categories` (live name; old CSV said `aux_product_types`)
- `products` — `id uuid PK`, unique `cordis_id`, `type`, `product_category_id`
- `products_cordis` — PK `product_id` FK `products`, unique `cordis_id`, publication fields
- `products_custom` — PK `product_id` FK `products` (admin-only; loader never deletes)
- `product_projects` — PK `(product_id, project_id)`, optional `role`

Column lists in SQL SHALL follow this live inventory, not the TEXT-id script. Implementation may add `IF NOT EXISTS` indexes that match existing unique/FK names where known.

### 4. Upsert, not DROP

**Choice:** `cordis:create` only DDL. `cordis:push` in a transaction:

1. Upsert aux taxonomies by `id` / unique `name`.
2. Upsert projects on `cordis_id` (`INSERT … ON CONFLICT (cordis_id) DO UPDATE`, `id` default `gen_random_uuid()` on insert).
3. Upsert entities the same way; map `organization_activity_type` text from XML/CSV to `organization_activity_type_id`.
4. For each project in the current CSV, replace `project_entities`, `project_risks`, `project_themes` rows **for that project_id only**.
5. Upsert CORDIS products: ensure `products` row, `products_cordis` row, `product_projects` link. Never `DELETE FROM products_custom`.

**Alternative:** DROP CASCADE then reload — rejected; it would destroy Hub UUIDs, entity admin edits, and custom products.

### 5. RLS in package SQL, pipeline bypasses it

**Choice:** `02_rls.sql` enables RLS, `GRANT SELECT` to `anon`/`authenticated`, write policies using the same `connected_admin` JWT checks as `09_skills_content.sql`. Load scripts use `DATABASE_URL` (Postgres role that bypasses RLS), identical to knowledge push.

Do not move this DDL into `packages/supabase-setup`: CORDIS is regenerable catalogue data, closer to `packages/db` than to one-time auth bootstrap. Skills stay in supabase-setup (editorial CMS, not XML-derived).

**This change does not apply SQL to hosted Supabase.** Commands exist for local/future operator use.

### 6. Audit

**Choice:** Port `auditXmlSupabase.js` to `src/audit-xml.ts`. Prefer `DATABASE_URL` + `postgres` SELECTs (same as loaders). Keep optional Supabase JS read path only if it stays strictly SELECT. Write reports under `data/audit_output/` (gitignored). **Do not execute against remote during implementation.**

### 7. Language and tests

**Choice:** TypeScript. Add a small fixture XML (one committed sample under `packages/cordis/fixtures/`) so parse can be smoke-tested without CORDIS or Supabase.

**Alternative:** Copy JS as-is — faster but fights the rest of `packages/*`.

## Risks / Trade-offs

- **[Risk] Schema SQL drifts from hosted extras** (triggers, extra indexes, policy names). Mitigation: match columns/FKs from the known live inventory; `IF NOT EXISTS` so applying later to production is additive. Do not claim bit-identical constraint names.
- **[Risk] 65-project push vs current 46 production rows.** Mitigation: upsert is additive; extra 2026 projects appear only when an operator later runs push. This change does not run that push remotely.
- **[Risk] Join-table replace scoped by project** could drop admin-edited `project_entities` for a project in the source list. Mitigation: document that XML is source of truth for CORDIS membership; admin entity field edits on `entities_cordis` survive via UUID upsert.
- **[Trade-off] Keyword risk/theme tagging stays heuristic** (typos included). Acceptable; changing taxonomy is out of scope.
- **[Trade-off] Leaving SQLite behind** means local dry-run needs a Postgres (local Supabase or similar). Acceptable per user decision.

## Migration Plan

1. Land the package, gitignore, and README. No hosted DB writes.
2. Optionally copy a couple of existing XMLs into `fixtures/` for parse tests.
3. After merge, an operator who wants the 2026 set on a **non-production** database runs download → parse → create → push.
4. Refreshing hosted Supabase is an explicit later operation, not part of this change.
5. Rollback: remove `packages/cordis` and root scripts; Hub UI keeps working on existing tables.

## Open Questions

- None blocking. Source list, SQLite, audit, and schema/upsert decisions were confirmed with the user.
