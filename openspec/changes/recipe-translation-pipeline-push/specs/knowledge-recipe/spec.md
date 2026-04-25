## ADDED Requirements

### Requirement: Translate recipe ingredients for target languages

After English augmentation, the translation pipeline SHALL produce a `recipe` object for each target language when the source augmented record contains a `recipe` object with `lang: "en"` and `ingredients`. For each canonical ingredients key, the pipeline SHALL set the translated value to a string in the target language when the English value is non-empty; when the English value is empty, the translated value SHALL be an empty string. The translated `ingredients` object SHALL contain exactly the same canonical keys as English normalization and SHALL NOT add `title`, `short_description`, or `sdgs`.

#### Scenario: Non-English recipe matches English structure

- **WHEN** an `*_en_augmented.json` file has `recipe.ingredients.context_summary` non-empty and the operator runs translation to `es`

- **THEN** the emitted `*_en_augmented_es.json` includes `recipe.lang === "es"` and `recipe.ingredients` has all canonical keys with `context_summary` in Spanish and empty keys still `""`

#### Scenario: English recipe fully empty skips meaningful translation

- **WHEN** `recipe.ingredients` has no non-empty string values in the English augmented file

- **THEN** the translation step SHALL NOT call the LLM for recipe translation for that document and SHALL omit `recipe` from the translation JSON or emit only empty strings per implementation choice documented in code; push SHALL skip recipe upsert for that translation file

### Requirement: Cache recipe translation on disk

The pipeline SHALL persist recipe translation results in a JSON cache file under `pipeline/caches/` separate from `translation_cache.json` and `recipe_extraction_cache.json`. Cache keys SHALL include a version prefix, the target language code, and a stable fingerprint of the English `ingredients` payload so unchanged English inputs reuse cached translations without calling the LLM.

#### Scenario: Cache hit skips recipe translation API

- **WHEN** the same English `recipe.ingredients` and target `lang` are processed again with an unchanged cache version

- **THEN** the translated `ingredients` are loaded from the cache file without a new LLM request for recipe translation

### Requirement: Translation JSON includes recipe for push

Translation-only output files (e.g. `*_en_augmented_es.json`) SHALL include `source_file`, `lang`, `title`, `subtitle`, `summary`, `fulltext`, and **`recipe`** when recipe translation applies. The top-level `lang` field continues to denote the translation target for summary/fulltext; `recipe.lang` SHALL equal that same target language code for the translated ingredients.

#### Scenario: Translation artifact carries recipe for ingestion

- **WHEN** a translation file is written for target `es` with a translated recipe

- **THEN** the JSON contains `recipe.lang === "es"` and `recipe.ingredients` suitable for `push-climate-adapt` pass 2 to upsert `knowledge.recipe` with `lang = 'es'`

## MODIFIED Requirements

### Requirement: Push script persists recipe

The `push-climate-adapt` ingestion SHALL upsert `knowledge.recipe` in **pass 1** for each English augmented file, using `document_id` from the upserted document and `lang` from `recipe.lang` when present (default `en`), reading `recipe.ingredients` from the augmented JSON. In **pass 2**, for each translation file paired by `source_file`, when the file contains `recipe.ingredients` with at least one non-empty string value after the same content check used for English, the ingestion SHALL upsert `knowledge.recipe` for that `document_id` with `lang` from `recipe.lang` (which MUST match the translation row language) and the translated `ingredients`. When `recipe` is absent or has no renderable content, the ingestion SHALL skip recipe upsert for that pass without failing the batch.

#### Scenario: Push writes English recipe row

- **WHEN** an augmented JSON file contains `recipe.ingredients` with non-empty `context_summary` after normalization

- **THEN** after push, the corresponding `knowledge.recipe` row for that document and `en` contains the same content in `ingredients`

#### Scenario: Push writes translated recipe row

- **WHEN** pass 1 completed for a document and pass 2 processes a translation file with `recipe.lang === "es"` and non-empty translated `ingredients`

- **THEN** after push, a `knowledge.recipe` row exists for that `document_id` and `lang = 'es'` with the translated `ingredients`

#### Scenario: Missing recipe key in English JSON

- **WHEN** an augmented file has no `recipe` object (e.g. legacy file or skipped extraction)

- **THEN** the push script SHALL skip recipe upsert for that document in pass 1 without failing the whole push

#### Scenario: Missing recipe in translation JSON

- **WHEN** a translation file has no renderable `recipe.ingredients`

- **THEN** pass 2 SHALL not remove an existing English recipe row and SHALL skip translated recipe upsert for that file without failing the whole push
