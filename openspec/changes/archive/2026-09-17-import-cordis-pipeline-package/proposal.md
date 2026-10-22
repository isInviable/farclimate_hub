## Why

Connected Action visualisations already live in this Hub, but the CORDIS ingest that fills `projects_cordis` / `entities_cordis` and related tables still lives in `/Users/sergiogalan/proyectos/farclimate/connected` (`dataProc/`). That repo will be deleted. This Hub has no SQL or loaders for those tables: `packages/db` only owns `knowledge.*`, and `packages/supabase-setup` only owns auth/human/skills. Without a first-class pipeline package here, the Connected Action dataset cannot be rebuilt or refreshed after the old project is gone.

## What Changes

- Add a new workspace package **`packages/cordis` (`@farclimate/cordis`)** that owns the Connected Action CORDIS pipeline end-to-end: download XML from CORDIS, parse to CSV, idempotent schema SQL matching the **live UUID + `cordis_id` model** (including the later product catalogue tables), upsert load, and a read-only XML↔DB audit.
- Use **`sources_2026.csv` (65 project URLs)** as the default source list (2026 Mission Projects Catalogue), not the 46-row 2025 list currently in production.
- Port and update the old `dataProc` scripts into TypeScript following `packages/db` conventions (`tsx`, root `.env` `DATABASE_URL`). Fix the old path bugs (`parse.js` reading `downloadsnew`, `download_xml.sh` writing XML next to the script).
- Replace the old **DROP + recreate** loader with **CREATE TABLE IF NOT EXISTS + upsert**. Preserve UUIDs on `cordis_id` conflict. Do not delete `products_custom` rows.
- **Do not run create, push, or audit against the remote Supabase project** during this change. Operators may download XML from CORDIS (public HTTP). Database commands are implemented and documented only.
- Leave behind: Nuxt frontend, Nitro `/api/tables.*` (already replaced by `cordisRepository.ts`), geo JSON (already in `apps/web`), admin UI (already here), and `loadSqlite.js`.

## Capabilities

### New Capabilities

- `cordis-pipeline`: Download, parse, schema, upsert, and optional read-only audit for Connected Action CORDIS tables in `public`, owned by `@farclimate/cordis`.

### Modified Capabilities

- (none)

## Impact

- New package `packages/cordis/` (SQL, TS scripts, `data/sources.csv`, README).
- Root `package.json` scripts (`cordis:download`, `cordis:parse`, `cordis:create`, `cordis:push`, `cordis:audit`) and `.gitignore` for generated XML/CSV/audit output.
- Root README documents the CORDIS flow beside the Climate-ADAPT flow.
- No Hub frontend or `knowledge` schema changes.
- No writes to hosted Supabase as part of implementation.
