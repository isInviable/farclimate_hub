# Multilanguage knowledge push — specification

## Purpose

Define how pipeline translation JSON files are discovered and loaded into Postgres for **any** supported ISO 639-1 language code produced by the translation step, without hard-coding a single locale.

## ADDED Requirements

### Requirement: Translation files are discovered by pattern, not by fixed locale

The push process SHALL discover translation inputs by matching files in the augmented directory whose names follow `*_en_augmented_<code>.json`, where `<code>` is a lowercase ISO 639-1 language code (two letters), and SHALL NOT rely on a single hard-coded suffix such as `_es` only.

#### Scenario: Spanish and Italian files both ingested

- **WHEN** `pipeline/augmented/` contains `page_0_en_augmented_es.json` and `page_0_en_augmented_it.json` with valid JSON bodies.
- **THEN** the push process SHALL process both files in its translation pass (subject to successful parse and document resolution).

#### Scenario: Future language without code changes

- **WHEN** operators add pipeline output `page_0_en_augmented_fr.json` with `lang: "fr"` and the corresponding English augmented file has already created the document row.
- **THEN** the push process SHALL ingest that file without modifying TypeScript locale-specific filters.

### Requirement: Translation row language comes from file content

For each translation JSON file, the push process SHALL read the `lang` field and SHALL use its normalized value as the key for `knowledge.summary_multilang`, `knowledge.fulltext`, and translated `knowledge.recipe` rows.

#### Scenario: Filename and JSON lang mismatch

- **WHEN** a file is named `*_en_augmented_it.json` but `lang` inside the JSON is `"it"` after trim (or differs from suffix).
- **THEN** the push process SHALL persist rows using the JSON `lang` value as authoritative and MAY log a warning when the filename suffix and `lang` disagree.

### Requirement: Translation upserts match existing Spanish semantics

For each resolved translation file, the push process SHALL upsert `knowledge.summary_multilang` (title, subtitle, summary), `knowledge.fulltext`, and when a renderable translated `recipe` is present, `knowledge.recipe`, using the same field mapping and empty-skip rules as the existing Spanish translation path.

#### Scenario: Recipe translated for non-English lang

- **WHEN** the translation JSON includes `recipe.ingredients` with content and `recipe.lang` matching the translation `lang`.
- **THEN** the push process SHALL upsert `knowledge.recipe` for that `document_id` and `lang`.

### Requirement: Documents must exist before applying translations

For each translation file, the push process SHALL resolve `document_id` by `source_file` from the English pass. If no document exists, the process SHALL skip that translation file and SHALL log a warning.

#### Scenario: Orphan translation skipped

- **WHEN** a translation file references a `source_file` that was not loaded from a matching `*_en_augmented.json` in the same run.
- **THEN** the push process SHALL not insert orphan translation rows for that file.
