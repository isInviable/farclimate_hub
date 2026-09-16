# @farclimate/cordis

CORDIS ingest for Connected Action (EU Mission Adaptation projects). Schema and loaders live here so the Hub can rebuild the dataset after `farclimate/connected` is deleted.

**Every command that writes uses `DATABASE_URL` and bypasses RLS.** Only `cordis:push` and `cordis:create` write; `cordis:drift` and `cordis:audit` are strictly read-only.

## Ordered commands

From the repo root (workspace `.env` supplies `DATABASE_URL`):

```bash
pnpm cordis:download          # CORDIS HTTP → packages/cordis/data/downloads/<id>.xml
pnpm cordis:parse             # XML + catalogue CSVs → packages/cordis/data/csv/
pnpm cordis:drift             # read-only: how the live database differs from sql/ and taxonomy.ts
pnpm cordis:push --dry-run    # upsert inside a transaction, write the change log, roll back
pnpm cordis:push              # the same, committed
pnpm cordis:audit             # read-only: does the database match the XML and the catalogue CSVs
pnpm cordis:audit-quality     # read-only: client-facing CORDIS source-quality report (shortName / VAT / web / keywords)
```

`cordis:download` skips projects already on disk, so growing `sources.csv` only fetches the new
projects. Pass `--refresh` to re-fetch everything, e.g. when CORDIS has revised existing records.

Smoke parse without network or database (committed FARCLIMATE fixture, writes to `data/tmp/`):

```bash
pnpm --filter @farclimate/cordis cordis:parse-fixture
```

## Inputs

| file | what it is |
| --- | --- |
| `data/sources.csv` | CORDIS XML URLs, one per project. The catalogue edition to load. |
| `data/project_climate_risks.csv` | Climate risks per project, parsed from the catalogue PDF. |
| `data/project_main_themes.csv` | Main themes per project, parsed from the catalogue PDF. |
| `src/taxonomy.ts` | The risk, theme, entity-type, and product-category vocabularies. |

Climate risks and main themes come from the **catalogue PDF**, not from CORDIS. The PDF shows them
as legend icons, so they were extracted once into the two CSVs above. This replaced a keyword
heuristic that guessed tags by substring-matching CORDIS titles and abstracts, which both invented
tags the catalogue never assigned and missed ones it did.

`taxonomy.ts` is the source of truth for the vocabularies, and `pdf-categories.ts` refuses to load a
CSV that disagrees with it: an unknown `risk_id`/`theme_id`, a `pdf_legend_name` that does not match
the taxonomy name, or a parsed project with no tags all abort the run. A new catalogue edition that
renames or adds a legend entry therefore forces a deliberate edit rather than silently reshaping
the data.

## Schema files

`sql/01_tables.sql` is additive and idempotent (`create table if not exists`, `create index if not
exists`, `comment on`), so it is safe to re-run:

```bash
pnpm --filter @farclimate/cordis cordis:create --tables-only
```

**`sql/02_rls.sql` must not be run against the hosted project.** The hosted database was secured by
hand in the Supabase console under different policy names, so `02_rls.sql`'s `drop policy if exists`
guards drop nothing, and its stricter `connected_admin` policy would be added *alongside* the live
permissive `Authenticated insert/update/delete` ones. Because permissive policies are OR'd, that
changes nothing: any logged-in user could still write to the whole catalogue. `cordis:create` refuses
to run without a mode for this reason, and `--with-rls` is for fresh databases only. Tightening the
live policies is a separate change that must drop the permissive ones in the same transaction, after
confirming admin JWTs really carry the `connected_admin` claim.

`sql/01_tables.sql` must stay a faithful description of the live database, because that is what
`cordis:drift` compares against.

## Recording manual database changes

The hosted database has been improved by hand (NOT NULL constraints, RLS policies, extra product
categories, corrected aux names). `cordis:drift` finds those differences and classifies them:

| severity | meaning |
| --- | --- |
| `BLOCKS_PUSH` | Would fail or corrupt the load. Fix before pushing. |
| `LIVE_IS_BETTER` | A manual improvement that exists only in the database. Confirm it, then back-port it into `sql/` or `taxonomy.ts`. |
| `REPO_IS_BETTER` | The repo defines something the database lacks. Decide whether to apply it. |
| `INFO` | Cosmetic or already-accepted. |

Reports land in `data/audit_output/drift_<stamp>.md` and `.json` and are committed, so the record of
what was reconciled survives. Run `cordis:drift` after any console edit; a `LIVE_IS_BETTER` finding
means this package is out of date.

It also lists every CORDIS publication type code in the corpus next to its `taxonomy.ts` mapping and
the category the database currently holds, so a new code or a changed mapping is visible before it
moves any rows.

## Upsert semantics

- Projects and entities upsert on unique `cordis_id`. Existing UUID `id` values are kept, so Hub
  links and `products_custom` rows keyed on them survive.
- `project_entities`, `project_risks`, and `project_themes` are replaced **only** for projects in the
  current CSV. Projects absent from `sources.csv` are never touched or deleted; `cordis:drift` lists
  them so removals stay a deliberate manual act.
- CORDIS products upsert into `products` + `products_cordis` + `product_projects`. Rows in
  `products_custom` are never deleted, and only `type = 'cordis'` links are refreshed.
- The same organisation appears in many projects with varying completeness, so entity fields are
  merged fill-in-blanks across the corpus rather than taken from whichever file parsed first.
- CORDIS XML is authoritative for the fields it owns, so a push overwrites values edited through
  `/admin`. `cordis:push` writes every such overwrite to `data/audit_output/` first, and `--dry-run`
  produces that log without touching the database.

## Refresh runbook

```bash
pnpm db:backup                                    # 1. snapshot first
pnpm cordis:download                              # 2. fetch new projects (skips existing)
pnpm cordis:parse                                 # 3. XML + catalogue CSVs → data/csv/
pnpm cordis:drift                                 # 4. review; back-port LIVE_IS_BETTER findings
pnpm cordis:push --dry-run                        # 5. read data/audit_output/changes_*_dryrun.md
pnpm cordis:push                                  # 6. commit
pnpm cordis:audit                                 # 7. expect zero problems
```

Step 4 is the point at which manual database changes get folded back into this package, and step 5
is the point at which tag and field changes get reviewed. Neither should be skipped.

## Left behind from `farclimate/connected`

Not copied here (already in the Hub, or deliberately dropped):

- Nuxt Connected Action UI and admin screens
- Nitro `/api/tables.*` (replaced by `apps/web/app/utils/cordisRepository.ts`)
- NUTS / europe geo JSON (`apps/web/app/assets`)
- `loadSqlite.js` local SQLite loader
- The 2025-only `sources.csv` (46 URLs) as a runtime input
- The keyword-matching risk/theme detector, replaced by the catalogue PDF CSVs
