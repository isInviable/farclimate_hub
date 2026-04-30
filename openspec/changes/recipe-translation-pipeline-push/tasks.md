## 1. Recipe translation + cache (Python)

- [x] 1.1 Add `pipeline/caches/recipe_translation_cache.json` (or chosen filename) with load/save helpers and a **versioned** cache key (`v1`, target `lang`, fingerprint of English `recipe.ingredients` JSON).
- [x] 1.2 Implement `_translate_recipe_ingredients` (or equivalent) using the existing Gemini client/env from `translate_augmented.py`, preserving canonical keys and empty strings; skip LLM when English recipe has no renderable content (reuse or mirror `recipeIngredientsHasContent` / normalization from `augment_with_ai.py` where practical).
- [x] 1.3 Wire `translate_record` / `process_file` to merge translated `recipe: { lang, ingredients }` into each `*_en_augmented_<lang>.json` output alongside title/subtitle/summary/fulltext.
- [x] 1.4 Document CLI usage in a one-line comment or existing pipeline doc if present (no new README unless project convention requires it).

## 2. Push script (TypeScript)

- [x] 2.1 In `packages/db/src/push-climate-adapt.ts` pass 2, read optional `trans.recipe`; when `recipeIngredientsHasContent` applies, call `upsertRecipe(documentId, recipeLang, recipe.ingredients)` with `recipeLang` from `recipe.lang` (must match translation target).
- [x] 2.2 Ensure missing or empty translated recipe does not fail push and does not delete the English recipe row.

## 3. Verification

- [x] 3.1 Run translate on a fixture or single augmented file and confirm output JSON includes `recipe` with correct `lang` and non-empty Spanish (or chosen `--lang`) where English had content.
- [x] 3.2 Dry-run or local push against a test DB (optional): confirm `knowledge.recipe` has a second row for `(document_id, 'es')` after pass 2.

## 4. OpenSpec / archive (after implementation)

- [ ] 4.1 When implementation is complete, run `/opsx:apply` workflow through tasks, then archive the change per project OpenSpec archive rules.
