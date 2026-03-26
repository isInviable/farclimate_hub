## Why

The platform needs a standardized, user-facing “Recipe” view for each case study: a single structured bundle of sections (“ingredients”) derived only from the source text. Today those ingredients are partly available elsewhere, but there is no pipeline step that extracts the full recipe nor a database row linking that content to the ingested document per language.

## What Changes

- Add a Gemini (or existing pipeline LLM) extraction step that takes the case-study source text and returns a single JSON object following the agreed recipe prompt (strictly source-grounded; empty strings for missing sections).
- Normalize model output keys to stable JSON keys stored in the database (e.g. `context_challenges` → `challenges`). Do **not** store `title`, `short_description`, or `sdgs` in recipe JSON — title and short narrative already live in `knowledge.summary_multilang`.
- Extend augmented English JSON (`*_en_augmented.json`) with a `recipe` object (metadata + `ingredients`) so downstream tooling and ingestion can read it.
- Add a `knowledge.recipe` table: `id`, `document_id` (FK to `knowledge.documents`, cascade delete), `lang`, and `ingredients` JSONB; unique on `(document_id, lang)`.
- Update `packages/db/src/push-climate-adapt.ts` to upsert recipe rows when pushing English augmented files (`lang = 'en'`).
- Add disk caching for recipe extraction keyed by source text and prompt version (same pattern as other augmentation caches).

## Capabilities

### New Capabilities

- `knowledge-recipe`: Pipeline extraction of the recipe JSON from source text, normalized `ingredients` shape, caching, augmented JSON output, and persistence to `knowledge.recipe` linked to the document.

### Modified Capabilities

- `consolidated-knowledge-schema`: Fresh `db:create` SHALL include the new `knowledge.recipe` table in the expected knowledge-schema table set (and remain compatible with existing GRANT/default-privilege behavior).

## Impact

- **Pipeline**: `pipeline/augment_with_ai.py` — new extraction function, prompt, cache file under `pipeline/caches/`, integration in `augment_record`.
- **Database**: `packages/db/sql/02_tables.sql` — new `knowledge.recipe` table and index on `(document_id, lang)`; comments for documentation.
- **Ingestion**: `packages/db/src/push-climate-adapt.ts` — `upsertRecipe` (or equivalent) in the English pass.
- **Optional / later**: Translated recipes for `es` (would tie into `translate_augmented.py` and the second push pass); not required for the initial capability.
- **Frontend / API**: No change in this proposal; consumers can read `knowledge.recipe` via Supabase when exposed.
