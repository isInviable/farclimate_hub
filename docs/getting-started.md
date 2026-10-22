# Getting started

How to run the Hub and the two data pipelines on this machine.

## Prerequisites

- **Node 22** (see `.nvmrc`) and **pnpm** (this is a pnpm workspace). Run `nvm use` in the repo root before `pnpm install` or `pnpm dev`. Node 20 will skip Nuxt native bindings and compile `better-sqlite3` against the wrong ABI.
- Python 3 for the Climate-ADAPT `pipeline/`
- A `.env` at the **repo root** (copy [`.env.example`](../.env.example))
- The `apps/web` env that `@nuxtjs/supabase` expects (`NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY`, plus the keys already listed in `.env.example`)

`DATABASE_URL` must be the **direct** Postgres URI from the Supabase dashboard, not the pooled one. Every `pnpm db:*` and `pnpm cordis:push` / `cordis:create` command uses it and **bypasses RLS**.

Do not point `DATABASE_URL` at hosted production unless you intend to load or change catalogue data.

## Install

From the repo root:

```bash
nvm use
pnpm install
```

The web app is `apps/web`. From that package:

```bash
cd apps/web
pnpm dev
```

The Hub is then at `http://localhost:3000`. Explorer, Connected Action (`/connected`), and admin (`/admin`) all read the hosted Supabase project configured in the web env.

## What to run for each job

### I want to look at the Hub

`pnpm dev` in `apps/web` is enough. No pipeline command is required.

### A new batch of Climate-ADAPT case studies arrived

Follow the numbered list in the [root README](../README.md) (`pipeline/` then `pnpm db:push`). Detail: [`pipeline/README.md`](../pipeline/README.md) and [`packages/db/README.md`](../packages/db/README.md).

Always `pnpm db:backup` first. `pnpm db:reset` / `db:drop` wipe the `knowledge` schema; they do not touch CORDIS tables, but they are still destructive.

### A new Mission Projects Catalogue arrived

That is a CORDIS refresh, not a Climate-ADAPT load. Follow [cordis-pipeline.md](cordis-pipeline.md).

### I changed something in the Supabase console

For CORDIS tables, run `pnpm cordis:drift` and back-port every `LIVE_IS_BETTER` finding into `packages/cordis/sql/` or `taxonomy.ts`. For knowledge/auth/human, the SQL in `packages/db/sql/` and `packages/supabase-setup/sql/` is what the next bootstrap will apply.

## Tests (web)

From `apps/web`:

```bash
pnpm test
pnpm typecheck
```

Targeted suites exist for pinboard RLS, artifacts, and multilingual search (`package.json` in `apps/web`).
