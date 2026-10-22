## 1. Package scaffold

- [x] 1.1 Create `packages/cordis/package.json` as `@farclimate/cordis` (`type: module`) with scripts: `cordis:download`, `cordis:parse`, `cordis:create`, `cordis:push`, `cordis:audit` (tsx entrypoints). Dependencies: `postgres`, `dotenv`, `fast-xml-parser`, `csv-parse`, `csv-stringify`; `tsx` + `@types/node` as in `@farclimate/db`.
- [x] 1.2 Add `packages/cordis/src/config.ts` and `src/run-sql.ts` mirroring `packages/db` (load workspace-root `.env`, `DATABASE_URL` required only for create/push/audit).
- [x] 1.3 Add root `package.json` script aliases (`cordis:download` … `cordis:audit`) filtering `@farclimate/cordis`.
- [x] 1.4 Gitignore `packages/cordis/data/downloads/`, `packages/cordis/data/csv/`, `packages/cordis/data/audit_output/`. Keep directory `.gitkeep` files so the tree exists.

## 2. Source list and download

- [x] 2.1 Commit `packages/cordis/data/sources.csv` as a copy of `farclimate/connected/dataProc/sources_2026.csv` (header `url` + 65 CORDIS XML URLs).
- [x] 2.2 Implement `src/download-xml.ts`: read sources, extract numeric id, write `data/downloads/<id>.xml`, fail the run if any URL is missing or the body is not XML.
- [x] 2.3 Download may be executed against **CORDIS HTTP** during implementation; do **not** use this step to talk to Supabase.

## 3. Parse

- [x] 3.1 Port `parse.js` to `src/parse-xml.ts`: XML parser options, RISK/THEME/ENTITY_TYPE/PRODUCT_TYPE keyword tables, entity/project/product extraction.
- [x] 3.2 Read from `data/downloads` (never `downloadsnew`). Write CSVs to `data/csv/`.
- [x] 3.3 CSV `id` / `projectId` / `entityId` columns are CORDIS numeric ids. Omit live-obsolete project `risks`/`themes` text columns; emit `project_risks.csv` and `project_themes.csv`.
- [x] 3.4 Add one small committed fixture XML under `packages/cordis/fixtures/` (copied from an existing download, e.g. FARCLIMATE `101112860`) and a smoke command or documented `tsx` invocation that parses the fixture without network or database.

## 4. Schema SQL (no remote apply)

- [x] 4.1 Write `sql/01_tables.sql`: `CREATE TABLE IF NOT EXISTS` for aux tables, `projects_cordis`, `entities_cordis`, `project_entities`, `project_risks`, `project_themes`, `aux_product_categories`, `products`, `products_cordis`, `products_custom`, `product_projects` with UUID PKs, unique `cordis_id` where applicable, and FKs matching the design (live model). No `DROP TABLE`.
- [x] 4.2 Write `sql/02_rls.sql`: enable RLS; SELECT for `anon` and `authenticated`; INSERT/UPDATE/DELETE for `connected_admin` JWT claim (same check as skills CMS). GRANT SELECT on these tables to `anon`/`authenticated`.
- [x] 4.3 Implement `src/create-tables.ts` to run `01` then `02` via `run-sql.ts`.
- [x] 4.4 **Do not run `cordis:create` against hosted Supabase** in this change.

## 5. Upsert push (no remote apply)

- [x] 5.1 Implement `src/push-cordis.ts`: transaction; upsert aux rows; upsert projects/entities on `cordis_id` preserving UUID; map activity type name → `organization_activity_type_id`; replace `project_entities` / `project_risks` / `project_themes` only for project ids in the current CSV.
- [x] 5.2 Upsert CORDIS products into `products` + `products_cordis` + `product_projects`. Do not delete `products_custom`.
- [x] 5.3 Refuse to start if `DATABASE_URL` is missing. Log row counts per table.
- [x] 5.4 **Do not run `cordis:push` against hosted Supabase** in this change.

## 6. Audit port (no remote run)

- [x] 6.1 Port `auditXmlSupabase.js` to `src/audit-xml.ts`: parse XML, SELECT overlap by `cordis_id`, write markdown/json under `data/audit_output/`. Read-only; no writes.
- [x] 6.2 **Do not run `cordis:audit` against hosted Supabase** in this change.

## 7. Docs

- [x] 7.1 Write `packages/cordis/README.md`: ordered commands, 2026 source list, upsert semantics, custom-product safety, explicit warning not to point `DATABASE_URL` at production until operators intend a refresh.
- [x] 7.2 Add a CORDIS section to the repo root README next to the Climate-ADAPT steps, pointing at the new package.
- [x] 7.3 List what was left behind (SQLite, Nuxt, Nitro APIs, geo, 2025-only `sources.csv`) so the old repo can be deleted later without surprises.

## 8. Verification (offline)

- [x] 8.1 Parse the committed fixture XML and confirm expected CSV headers / at least one project row.
- [x] 8.2 Typecheck the package (`tsc --noEmit` or equivalent) with the rest of the workspace.
- [x] 8.3 Confirm no implementation step used the hosted Supabase project (no `cordis:create` / `push` / `audit` against production `DATABASE_URL`).
