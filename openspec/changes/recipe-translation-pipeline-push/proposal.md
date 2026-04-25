## Why

Case-study “recipe” sections are extracted in English and persisted to `knowledge.recipe` with `lang = 'en'`, but the translation step only covers title, subtitle, summary, and fulltext. Spanish (and other locale) UIs join `knowledge.recipe` on `filter_lang`, so users never see translated recipe content. The database already supports `(document_id, lang)`; the gap is pipeline output and the push script.

## What Changes

- Extend the augmented translation pipeline so each target language gets **translated `recipe.ingredients`** (same canonical keys as English, string values), using the same LLM approach as existing field translation.
- Add a **dedicated JSON cache file** for recipe translation (versioned keys, analogous to `translation_cache.json` / recipe extraction cache) so re-runs do not repeat API calls for identical source ingredients + target language.
- Include **`recipe` in translation-only JSON files** (e.g. `*_en_augmented_es.json`): `lang` set to the target code and `ingredients` the translated map (empty sections remain empty strings).
- Extend **`push-climate-adapt`** pass 2: when a translation file contains a renderable translated recipe, upsert `knowledge.recipe` for that `document_id` and target `lang` (in addition to existing `summary_multilang` and `fulltext` updates).

No **BREAKING** schema changes: `knowledge.recipe` shape is unchanged.

## Capabilities

### New Capabilities

- (none — requirements are expressed as a delta to the existing `knowledge-recipe` capability.)

### Modified Capabilities

- `knowledge-recipe`: add normative requirements for recipe translation, on-disk cache, translation JSON shape, and push-time persistence for non-English recipe rows alongside existing extraction and English push behavior.

## Impact

- `pipeline/translate_augmented.py` (or a small companion module) and new cache under `pipeline/caches/`.
- `packages/db/src/push-climate-adapt.ts` pass 2.
- Operators re-run translate then push to backfill `es` (etc.) recipe rows; no Supabase DDL required.
