# Knowledge recipe (pipeline + database)

Standardized “Recipe” extraction from case-study text, stored per document and language in `knowledge.recipe`.

---

## ADDED Requirements

### Requirement: Recipe table in knowledge schema

The system SHALL define a table `knowledge.recipe` with:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `document_id UUID NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE`
- `lang TEXT NOT NULL`
- `ingredients JSONB NOT NULL`

The table SHALL enforce `UNIQUE (document_id, lang)`. The `ingredients` object SHALL contain **only** the canonical keys: `who_is_involved`, `economic_data`, `context_summary`, `challenges`, `policy_context`, `legal_aspects`, `objectives`, `solutions_implemented`, `implementation_phases`, `success_and_limiting`, `benefits`, `lessons_learnt`, `transferability`. All values SHALL be strings. Title and short narrative SHALL NOT appear in `ingredients` (they are provided via `knowledge.summary_multilang`). `sdgs` SHALL NOT be stored.

#### Scenario: One row per document and language

- **WHEN** a recipe is persisted for `document_id` D and `lang` `en`
- **THEN** a single row exists with `(document_id, lang) = (D, 'en')` and upsert updates `ingredients` on conflict

#### Scenario: Cascade delete

- **WHEN** a document row is deleted from `knowledge.documents`
- **THEN** all `knowledge.recipe` rows referencing that `document_id` are removed

### Requirement: Recipe extraction prompt behavior

The pipeline SHALL call the LLM with instructions equivalent to the project recipe prompt, **excluding** any request for `title`, `short_description`, or SDG content: only information explicitly present in the source text; empty string for any section without supporting content; no merging across sections; no preamble or markdown fences in the model response; output is one JSON object whose keys map to the canonical `ingredients` fields (including model keys `context_challenges`, `context_policy`, `context_legal_aspects`, `success_and_limiting_factors`, etc.).

#### Scenario: Absent section in source

- **WHEN** the source text contains no content for a given section

- **THEN** the corresponding key in the model output is an empty string and the normalized `ingredients` key for that section is also empty

### Requirement: Normalize model JSON to ingredients

The pipeline SHALL map model output keys to canonical `ingredients` keys (e.g. `context_challenges` → `challenges`, `context_policy` → `policy_context`, `context_legal_aspects` → `legal_aspects`, `success_and_limiting_factors` → `success_and_limiting`). The pipeline SHALL NOT include `title`, `short_description`, or `sdgs` in `ingredients`. If the model returns any of those keys, the pipeline SHALL omit them after normalization.

#### Scenario: Full mapping applied

- **WHEN** the model returns valid JSON with `context_challenges` set and `context_policy` empty

- **THEN** `ingredients.challenges` equals the model’s `context_challenges` string and `ingredients.policy_context` is `""`

#### Scenario: Redundant keys discarded

- **WHEN** the model returns `title` or `short_description` alongside valid section keys

- **THEN** the normalized `ingredients` object contains neither key

### Requirement: Cache recipe extraction

The pipeline SHALL persist extraction results using the **same caching approach as other augmentation extractions** in `augment_with_ai.py`: a JSON cache file under `pipeline/caches/`, keys that include a **version prefix** (prompt / `ingredients` schema version) and the input text or its hash, so identical inputs do not repeat LLM calls when re-running the pipeline or processing additional datasets.

#### Scenario: Cache hit avoids API call

- **WHEN** the same source text and prompt version are processed again

- **THEN** the cached normalized `ingredients` are reused without calling the LLM

### Requirement: Include recipe in English augmented JSON

For English augmentation output files (`*_en_augmented.json`), `augment_record` SHALL add a `recipe` object with `lang: "en"` and `ingredients` set to the normalized structure.

#### Scenario: Augmented file contains recipe

- **WHEN** an English record is augmented successfully

- **THEN** the written JSON includes `recipe.lang === "en"` and `recipe.ingredients` with all canonical keys

### Requirement: Push script persists recipe

The `push-climate-adapt` ingestion SHALL upsert `knowledge.recipe` for each English augmented file, using `document_id` from the upserted document and `lang = 'en'`, reading `recipe.ingredients` from the augmented JSON.

#### Scenario: Push writes recipe row

- **WHEN** an augmented JSON file contains `recipe.ingredients` with non-empty `context_summary` after normalization

- **THEN** after push, the corresponding `knowledge.recipe` row for that document and `en` contains the same content in `ingredients`

#### Scenario: Missing recipe key in JSON

- **WHEN** an augmented file has no `recipe` object (e.g. legacy file or skipped extraction)

- **THEN** the push script SHALL either skip recipe upsert or upsert empty normalized ingredients per implementation choice documented in code, without failing the whole push
