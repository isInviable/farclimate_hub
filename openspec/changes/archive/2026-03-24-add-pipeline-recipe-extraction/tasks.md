## 1. Database schema

- [x] 1.1 Add `knowledge.recipe` table (`id`, `document_id` FK CASCADE, `lang`, `ingredients` JSONB) with `UNIQUE (document_id, lang)` and index in `packages/db/sql/02_tables.sql`
- [x] 1.2 Add table/column comments; confirm `06_public_api.sql` grants cover the new table on fresh `db:create`

## 2. Pipeline extraction

- [x] 2.1 Add trimmed recipe prompt (no `title`, `short_description`, or SDGs) plus a version constant for cache invalidation, aligned with other prompts in `augment_with_ai.py`
- [x] 2.2 Implement `extract_recipe(source_text)` using the same Gemini client/error-handling patterns as existing extractions in that script, parsing JSON-only response, with retry or safe fallback on parse errors
- [x] 2.3 Implement normalization from model keys to canonical `ingredients` keys only; strip `title`, `short_description`, and `sdgs` if present
- [x] 2.4 Add `pipeline/caches/recipe_extraction_cache.json` using the same file-cache conventions as `cost_estimation_cache.json` (version-prefixed keys, load/save helpers)
- [x] 2.5 Wire `extract_recipe` into `augment_record`; skip LLM when source text is empty; emit `recipe: { lang: "en", ingredients }` on `*_en_augmented.json`

## 3. Ingestion

- [x] 3.1 Add `upsertRecipe(documentId, lang, ingredients)` in `packages/db/src/push-climate-adapt.ts`
- [x] 3.2 Call it from the English augmented pass with `lang = 'en'`; handle missing `recipe` without failing the full push

## 4. Verification

- [ ] 4.1 Run augmentation on a sample page and confirm JSON contains normalized `recipe.ingredients` (requires `GEMINI_API_KEY` in `.env`)
- [ ] 4.2 Run push against a dev DB and confirm `knowledge.recipe` rows match augmented output (requires DB URL / `db:create` with new schema)
