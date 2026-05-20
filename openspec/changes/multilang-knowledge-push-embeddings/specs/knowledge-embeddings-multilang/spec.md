# Multilanguage composed embeddings — specification

## Purpose

Define how **composed** document embeddings are stored per language so `hybrid_search` can use the semantic branch when `filter_lang` matches a locale with translated title, summary, and fulltext.

## ADDED Requirements

### Requirement: Composed embedding per document and language

For each document that has translatable text loaded for a given `lang` (title/summary/fulltext available via `summary_multilang` and `fulltext` after translation upsert), the ingestion process SHALL compute a single **`composed`** embedding from `composeEmbeddingText(title, summary, fulltext)` using the **translated** strings for that `lang` and SHALL upsert `knowledge.embeddings` with `(document_id, lang, content_type = 'composed')`.

#### Scenario: Italian embedding stored alongside English

- **WHEN** Italian `summary_multilang` and `fulltext` rows exist for a document after processing `*_en_augmented_it.json`.
- **THEN** the process SHALL insert or update an embedding row with `lang = 'it'` and `content_type = 'composed'` for that document, using the same embedding model and dimensionality as English.

### Requirement: Embedding parameters match English

The embedding model identifier, vector dimensions, and document task type (`RETRIEVAL_DOCUMENT`) used for non-English composed embeddings SHALL match those used for English composed embeddings in the same environment (same env configuration and `packages/db` embed helper).

#### Scenario: Search compatibility

- **WHEN** the web tier generates a query embedding with `gemini-embedding-001` at 768 dimensions for `RETRIEVAL_QUERY`.
- **THEN** stored composed embeddings for any `lang` SHALL be comparable in `hybrid_search` with that query embedding (same model family and dimensionality as configured for English documents).

### Requirement: Skip embedding when no composable text

When `composeEmbeddingText` yields an empty string for a given language (all of title, summary, fulltext missing or blank), the process SHALL NOT fail the push; it MAY omit an embedding row for that `(document_id, lang)` or leave an existing row unchanged per implementation choice documented in tasks.

#### Scenario: Empty translation fields

- **WHEN** a translation file exists but title, summary, and fulltext are all empty after processing.
- **THEN** the push process SHALL complete without throwing, and composed embedding for that language MAY be absent.

### Requirement: Regeneration script supports multiple languages

The DB maintenance script that regenerates embeddings from stored text (historically English-only) SHALL be extended to regenerate **`composed`** embeddings for every language that has rows in `knowledge.summary_multilang` and `knowledge.fulltext`, or SHALL accept an explicit list of language codes to limit scope for operators.

#### Scenario: Backfill after model change

- **WHEN** operators change `GEMINI_EMBEDDING_MODEL` or dimensions and run the regeneration script.
- **THEN** the script SHALL be able to refresh composed embeddings for `en`, `es`, `it`, and other present langs consistent with configuration.
