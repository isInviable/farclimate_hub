# FARCLIMATE Hub — start here

Read this file the next time you open the repo. It is the map of what the project is, what is already done, and what to do next.

The Hub is a Nuxt 3 + Supabase platform with three product blocks:

| Block | What it is | Where it lives |
| --- | --- | --- |
| **Explorer** | Climate-ADAPT case studies: search, filters, pinboards, chat, artifacts | `pipeline/` → `packages/db/` → `apps/web` (`/explorer`) |
| **Connected Action** | CORDIS Mission Adaptation catalogue: projects, organisations, products, dashboards | `packages/cordis/` → `public.*_cordis` tables → `apps/web` (`/connected`) |
| **Admin** | Manual edits to Connected Action aux tables and products | `apps/web/app/pages/admin/` (gated by `connected_admin`) |

Both pipelines write to the same hosted Supabase project. Explorer data lives in the `knowledge` and `human` schemas. Connected Action data lives in `public` (`projects_cordis`, `entities_cordis`, …).

## First 15 minutes after a break

1. Read [getting-started.md](getting-started.md) if you need to run the Hub locally.
2. If the next Mission Projects Catalogue has arrived, follow [cordis-pipeline.md](cordis-pipeline.md). Do not invent a new importer.
3. If you edited tables by hand in the Supabase console, run `pnpm cordis:drift` (Connected) or treat `packages/db/sql/` as the source of truth (Explorer). Fold confirmed improvements back into SQL before the next load.
4. Check [Outstanding work](#outstanding-work) below before starting a new feature.

## Outstanding work

These are the items that will bite you if you forget them.

### Connected Action catalogue writes are too open

Any **logged-in** user can currently `INSERT`/`UPDATE`/`DELETE` all 13 CORDIS tables through the Supabase API. Admin-only access is enforced only by Nuxt middleware on `/admin`.

The intended model is already documented in [user-roles.md](user-roles.md): the JWT should carry `connected_admin`, and RLS should require that claim for writes. The live policies still check only `auth.role() = 'authenticated'`.

**Do not** run `pnpm cordis:create --with-rls` against hosted to "fix" this. That file would *add* the stricter policies next to the live permissive ones; because permissive policies are OR'd, nothing would get tighter. The fix is: confirm admin JWTs carry the claim, then drop the three `Authenticated *` policies and add the `connected_admin` ones in the **same** transaction. Details in [cordis-pipeline.md](cordis-pipeline.md#rls-follow-up).

### Next CORDIS catalogue edition

When a new PDF + project list arrives (the 2025 list had 46 projects; the 2026 list has 65):

1. Update `packages/cordis/data/sources.csv`.
2. Re-extract climate risks and main themes from the PDF into `project_climate_risks.csv` and `project_main_themes.csv`.
3. If the PDF legend renamed or added a risk/theme, edit `packages/cordis/src/taxonomy.ts` first. The parser will refuse to load a CSV that disagrees with it.
4. Run the runbook in [cordis-pipeline.md](cordis-pipeline.md). Always `db:backup` and `cordis:push --dry-run` before a real push.

### Explorer / knowledge backlog

Older product notes and filter ideas still live in [TODO.md](TODO.md). Architecture of `human` vs `knowledge` is in [DB_Arch.md](DB_Arch.md).

## Repo map

```
apps/web/                 Nuxt Hub (Explorer, Connected, admin, static pages)
packages/cordis/          CORDIS download → parse → drift → push → audit
packages/db/              knowledge schema + Climate-ADAPT loader
packages/supabase-setup/  one-time Auth / human-schema / connected_admin bootstrap
pipeline/                 Climate-ADAPT HTML → JSON → AI augment → translate
docs/                     this folder
```

Root commands (see `package.json`):

| command | writes? | purpose |
| --- | --- | --- |
| `pnpm db:backup` | no (dumps) | snapshot hosted Postgres before a load |
| `pnpm db:push` | yes | load Climate-ADAPT JSON into `knowledge` |
| `pnpm cordis:download` | disk only | fetch CORDIS XML (skips files already on disk) |
| `pnpm cordis:parse` | disk only | XML + PDF CSVs → `packages/cordis/data/csv/` |
| `pnpm cordis:drift` | no | live DB vs `packages/cordis/sql/` + `taxonomy.ts` |
| `pnpm cordis:push --dry-run` | no (rolls back) | preview tag/field changes |
| `pnpm cordis:push` | yes | upsert CORDIS catalogue |
| `pnpm cordis:audit` | no | XML + PDF CSVs vs live DB; expect 0 problems |
| `pnpm cordis:audit-quality` | no | Client report: CORDIS gaps in shortName / VAT / web / keywords |
| `pnpm cordis:create --tables-only` | yes, additive | safe: `CREATE TABLE/INDEX IF NOT EXISTS` |
| `pnpm cordis:create --with-rls` | yes | **fresh databases only**, never hosted |

## Other docs in this folder

| file | when to open it |
| --- | --- |
| [getting-started.md](getting-started.md) | install, env, run the Hub |
| [cordis-pipeline.md](cordis-pipeline.md) | next CORDIS refresh, current row counts, RLS follow-up |
| [DB_Arch.md](DB_Arch.md) | `human` vs `knowledge` schemas |
| [user-roles.md](user-roles.md) | `anon` / `authenticated` / `connected_admin` |
| [search-and-embeddings.md](search-and-embeddings.md) | Explorer hybrid search |
| [explorer-search-behavior.md](explorer-search-behavior.md) | how search feels in the UI |
| [multilingual-system.md](multilingual-system.md) | i18n + translated knowledge rows |
| [server-supabase-security.md](server-supabase-security.md) | service-role vs anon keys |
| [public-pinboard-sharing.md](public-pinboard-sharing.md) | public pinboards |
| [presentation-structure-generation.md](presentation-structure-generation.md) | slideshow artifacts |
| [TODO.md](TODO.md) | older Explorer backlog and filter notes |

Package READMEs have the command-level detail: [`packages/cordis/README.md`](../packages/cordis/README.md), [`packages/db/README.md`](../packages/db/README.md), [`packages/supabase-setup/README.md`](../packages/supabase-setup/README.md), [`pipeline/README.md`](../pipeline/README.md).
