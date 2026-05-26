# @farclimate/db

Schema, migrations and load scripts for the regenerable `knowledge` domain (Supabase/Postgres). For the full data-load flow see the [repo root README](../../README.md).

For one-time Supabase environment bootstrap work such as auth/RBAC setup, use the separate `packages/supabase-setup` pipeline instead of this package.

## Scripts

- **`pnpm db:create`** — Creates the knowledge schema and all tables/functions by running the SQL files in `sql/` (documents, summary, summary_multilang, fulltext, embeddings, search and facet functions). Run once per environment or after schema changes. After changing `sql/04_search_functions.sql` (e.g. new FTS language), run this or apply the function definitions in that file to the target database.
- **`pnpm db:push`** — Reads JSON from `pipeline/augmented/`: for each `*_en_augmented.json` (English) it upserts documents, images, `summary`, `summary_multilang` / `fulltext` / `recipe` for `en`, and computes a **`composed`** embedding for `lang = 'en'`. It then processes **every** `*_en_augmented_<code>.json` translation file (e.g. `_es`, `_it`, …), upserting `summary_multilang`, `fulltext`, optional `recipe`, and a **`composed`** embedding for that `lang`. Translated text cost scales with **number of documents × number of languages** (each language triggers embedding API calls, with local cache in `pipeline/caches/embeddings_cache.json`).

  **Prerequisite for a new language:** run the pipeline translation step first, e.g. `python pipeline/translate_augmented.py --lang it`, so `*_en_augmented_it.json` files exist beside the English JSON; then `db:push` will pick them up without code changes.

- **`pnpm db:embed`** — Regenerates **`composed`** embeddings from rows already in the database (no pipeline JSON). By default it selects **every distinct `lang`** in `knowledge.summary_multilang` and recomputes embeddings for each. Limit languages with an argument:  
  `pnpm db:embed -- --langs=en,it`  
  Use after changing `GEMINI_EMBEDDING_MODEL` / dimensions, or to backfill embeddings if push did not complete.

- **`pnpm db:drop`** — Drops the knowledge schema (destructive). Use when you want to remove all knowledge tables and functions (e.g. tear down the env or start completely fresh).
- **`pnpm db:truncate`** — Truncates knowledge tables, keeps schema. Use when you want to empty data but keep tables/functions, then run `db:push` to reload (e.g. reload same pipeline output without recreating schema).
- **`pnpm db:reset`** — drop + create + push in one go. Use when you want a full reset: wipe schema, recreate it, and reload from `pipeline/augmented/`.
- **`pnpm db:backfill-italian-fts`** — One-time fix for existing databases: applies `03_triggers.sql` (including `ts_config_for_lang` with `italian` for `it`), `04_search_functions.sql`, and `07_backfill_italian_fts.sql`. Run after deploying the Italian FTS fix to an environment that already has data. Fresh `db:push` loads already use the updated trigger; backfill is only needed when `knowledge.fulltext` rows for `lang = 'it'` were indexed with the old `simple` config.

### Full-text search language configs

Indexing (`fulltext_fts_trigger`) and querying (`keyword_search`, `hybrid_search`) both use `knowledge.ts_config_for_lang(lang)`: `en` → `english`, `es` → `spanish`, `it` → `italian`, else `simple`. If you add a language to that mapping, update `sql/03_triggers.sql` and re-touch existing fulltext rows for that `lang` (see `07_backfill_italian_fts.sql` as a template).

## Configuration

Requires a Postgres connection (e.g. Supabase). Set in repo or package `.env`:

- `DATABASE_URL` — connection string used by `create-tables`, `push-climate-adapt`, `generate-embeddings`, etc.
- For embeddings: `GEMINI_API_KEY` (and optionally `GEMINI_EMBEDDING_MODEL`, `GEMINI_EMBEDDING_DIMENSIONS`). The push script and `embed.ts` also look for `pipeline/.env` for the API key.

Run from repo root: `cd packages/db && pnpm db:create` and `pnpm db:push`.
