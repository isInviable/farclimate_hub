# CORDIS / Connected Action pipeline

How the Mission Adaptation catalogue gets from CORDIS + the catalogue PDF into the Hub, and what to do when the next edition arrives.

The Hub reads these tables through `apps/web/app/utils/cordisRepository.ts`. **Do not rename tables or columns** to load a new batch; the frontend must keep the same endpoints.

Package-level command reference: [`packages/cordis/README.md`](../packages/cordis/README.md).

## Current live state (after the 2026-09-15 refresh)

| table | rows |
| --- | --- |
| `projects_cordis` | 65 |
| `entities_cordis` | 1198 |
| `project_entities` | 1632 |
| `project_risks` | 491 |
| `project_themes` | 450 |
| `products` | 385 (`products_custom` still 2) |
| `products_cordis` | 383 |
| `product_projects` | 387 |

Post-load audit (`packages/cordis/data/audit_output/audit_2026-09-15_163926.md`) reported **0 problems**. The committed change log is `changes_2026-09-15_163918.md` in the same folder.

That refresh replaced the 2025 46-project load. Climate risks and main themes now come from the catalogue PDF CSVs, not from the old keyword heuristic. 10 keyword-guessed tags were removed; 340 catalogue tags were added.

Backup taken immediately before the push: `backups/2026-09-15-163458/`.

## Inputs you must update for a new edition

| file | role |
| --- | --- |
| `packages/cordis/data/sources.csv` | One CORDIS XML URL per project (`…/project/id/<number>`). This **is** the catalogue edition. |
| `packages/cordis/data/project_climate_risks.csv` | Per-project climate risks extracted from the PDF legend. |
| `packages/cordis/data/project_main_themes.csv` | Per-project main themes extracted from the PDF legend. |
| `packages/cordis/src/taxonomy.ts` | Canonical names and ids for risks, themes, entity types, product categories. |

The PDF shows risks and themes as **icons**, not text. Someone (or a script) has to turn the legend into the two CSVs. The parser will **abort** if:

- a `risk_id` / `theme_id` is not in `taxonomy.ts`
- `pdf_legend_name` does not match the taxonomy `name`
- a project present in the XML has no tags

That is intentional. A renamed or new legend entry must be added to `taxonomy.ts` (and then to the aux tables via the next push) on purpose.

Product type codes that CORDIS has never sent before are **not** fatal: they fall back to category id `8` (`other`) and `cordis:drift` lists them so you can give them a real mapping.

## Runbook (every refresh)

From the repo root, with `DATABASE_URL` pointing at the target database:

```bash
pnpm db:backup                 # 1. snapshot first
pnpm cordis:download           # 2. new ids only; add --refresh to re-fetch existing XML
pnpm cordis:parse              # 3. fails loud if the PDF CSVs disagree with taxonomy.ts
pnpm cordis:drift              # 4. back-port LIVE_IS_BETTER, fix BLOCKS_PUSH
pnpm cordis:push --dry-run     # 5. read packages/cordis/data/audit_output/changes_*_dryrun.md
pnpm cordis:push               # 6. commit
pnpm cordis:audit              # 7. expect 0 problems
pnpm cordis:audit-quality      # 8. optional: client-facing source-quality report (shortName / VAT / web)
```

Skip neither 4 nor 5. Step 4 is how console edits get back into git. Step 5 is how you see every tag add/remove and every field overwrite (including values previously edited in `/admin` — CORDIS XML wins for the fields it owns).

`cordis:download` skips XML already on disk. Growing `sources.csv` from 65 to N only fetches the new projects. Use `--refresh` when CORDIS itself revised existing records.

Smoke-test the parser without touching the database:

```bash
pnpm --filter @farclimate/cordis cordis:parse-fixture
```

That writes to `packages/cordis/data/tmp/`, not to `data/csv/`. Never point `cordis:parse-fixture` at `data/csv/` or a later `cordis:push` will load the one-project fixture.

## What the loader will and will not do

- Upserts projects and entities on `cordis_id`. Existing UUIDs stay, so Hub links and `products_custom` rows survive.
- Replaces `project_entities`, `project_risks`, and `project_themes` **only** for projects in the current CSV.
- **Never deletes** a project, entity, or publication that dropped out of the new list. Those stay in the database and are listed in the change log / drift report. Removal is a deliberate manual SQL act.
- Does not blank a populated field when the new XML omits it (a later CORDIS dump sometimes drops `short_name`).
- Re-links publications by incoming product id, not by “delete every cordis link on this project”. Withdrawn publications keep their old links instead of becoming orphans.
- Does not touch `products_custom`.

## Schema files vs the live database

`packages/cordis/sql/01_tables.sql` must stay a faithful description of hosted, because that is what `cordis:drift` compares against. It is additive (`IF NOT EXISTS`). Safe to apply with:

```bash
pnpm --filter @farclimate/cordis cordis:create --tables-only
```

`packages/cordis/sql/02_rls.sql` is **not** safe against hosted. `cordis:create` refuses to run without `--tables-only` or `--with-rls` for this reason. `--with-rls` is for a brand-new empty database only.

After any console edit, `pnpm cordis:drift` classifies differences:

| severity | meaning |
| --- | --- |
| `BLOCKS_PUSH` | Fix before loading. |
| `LIVE_IS_BETTER` | Confirm, then copy into `sql/` or `taxonomy.ts`. |
| `REPO_IS_BETTER` | Decide whether to apply it. The two RLS items below are accepted. |
| `INFO` | Cosmetic. |

Reports land in `packages/cordis/data/audit_output/drift_<stamp>.md`.

## RLS follow-up

Still open. Live write policies on all 13 CORDIS tables are:

- `Authenticated insert`
- `Authenticated update`
- `Authenticated delete`

each with `auth.role() = 'authenticated'`. Any signed-in user can edit the catalogue via the API. The Nuxt `/admin` middleware only hides the UI.

Intended end state is already written in `02_rls.sql`: public `SELECT`, writes only when the JWT has `connected_admin` (see [user-roles.md](user-roles.md) and `packages/supabase-setup/sql/02_connected_admin_auth_hook.sql`).

Safe sequence:

1. Sign in as an admin, inspect the JWT, confirm `user_role = connected_admin` or `app_metadata.connected_admin = true`.
2. If the claim is missing, fix the auth hook / `public.assign_connected_admin(...)` **before** touching policies.
3. In **one** transaction: drop the three live `Authenticated *` policies on each table and create the `Connected admins can manage <table>` policies from `02_rls.sql`.
4. Re-test `/admin` and a non-admin signed-in user (the latter must fail writes).
5. Run `pnpm cordis:drift` and confirm those `REPO_IS_BETTER` findings are gone.

If you apply `02_rls.sql` without dropping the live write policies, the database will look stricter and still be wide open.

## Judgement call already made (2026)

`CONFERENCE_PROCEEDING` publications were remapped from category 8 (*other*) to 3 (*conference proceedings*) because the old lookup only knew the plural `CONFERENCE_PROCEEDINGS`. That moved 48 existing rows. To undo it, remove `CONFERENCE_PROCEEDING` from id 3 in `taxonomy.ts` and re-run parse + push.

## ## Client-facing quality report

The January 2026 report the client liked (entities missing shortName / VAT / web, projects without keywords) is `pnpm cordis:audit-quality`. It is a port of `farclimate/connected/dataProc/auditXmlSupabase.js`. Reports land in `packages/cordis/data/audit_output/quality_<stamp>.md`.

That is different from `pnpm cordis:audit`, which checks whether the loader copied everything it should.

Pass `--sampleSize=12` (the default) to keep the same sample size as the old report.

## When something looks wrong

| symptom | look at |
| --- | --- |
| Parse dies on unknown risk/theme id or name | `taxonomy.ts` vs the new PDF CSVs |
| Push would rename aux rows | `cordis:drift` aux section; adopt the live spelling in `taxonomy.ts` |
| Dry-run shows hundreds of geolocation/city changes | normal; CORDIS revises organisation records |
| Audit reports extra tags | leftover keyword tags, or a project you edited in `/admin` that the PDF CSVs do not assign |
| Frontend still shows 46 projects | hard refresh; `cordisRepository.ts` has no year filter, so this is a cache or you pointed the web env at another project |
