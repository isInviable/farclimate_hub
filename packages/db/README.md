# @farclimate/db

Schema, migrations and load scripts for the knowledge base (Supabase/Postgres). For the full data-load flow see the [repo root README](../../README.md).

## Scripts

- **`pnpm db:create`** — Creates the knowledge schema and all tables/functions by running the SQL files in `sql/` (documents, summary, summary_multilang, fulltext, embeddings, search and facet functions). Run once per environment or after schema changes.
- **`pnpm db:push`** — Reads JSON from `pipeline/augmented/`: `*_en_augmented.json` and `*_en_augmented_<lang>.json`. Inserts/updates `knowledge.documents`, `knowledge.summary`, `knowledge.summary_multilang`, `knowledge.fulltext`, and computes+upserts embeddings in `knowledge.embeddings`. Use after running the pipeline (fetch → extract → augment → translate).
- **`pnpm db:embed`** — Regenerates embeddings for all existing documents from their title/summary/fulltext in the DB (no pipeline files). Use if you changed the embedding model or need to backfill.
- **`pnpm db:drop`** — Drops the knowledge schema (destructive). Use when you want to remove all knowledge tables and functions (e.g. tear down the env or start completely fresh).
- **`pnpm db:truncate`** — Truncates knowledge tables, keeps schema. Use when you want to empty data but keep tables/functions, then run `db:push` to reload (e.g. reload same pipeline output without recreating schema).
- **`pnpm db:reset`** — drop + create + push in one go. Use when you want a full reset: wipe schema, recreate it, and reload from `pipeline/augmented/`.

## Configuration

Requires a Postgres connection (e.g. Supabase). Set in repo or package `.env`:

- `DATABASE_URL` — connection string used by `create-tables`, `push-climate-adapt`, `generate-embeddings`, etc.
- For embeddings: `GEMINI_API_KEY` (and optionally `GEMINI_EMBEDDING_MODEL`, `GEMINI_EMBEDDING_DIMENSIONS`). The push script and `embed.ts` also look for `pipeline/.env` for the API key.

Run from repo root: `cd packages/db && pnpm db:create` and `pnpm db:push`.
