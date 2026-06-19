## ADDED Requirements

### Requirement: Fulltext is translated completely

The translation pipeline SHALL translate the entire English `fulltext` for each target language without discarding source content. The pipeline SHALL NOT silently truncate the source input (the prior fixed 20,000-character input cap is removed); when provider per-request limits would be exceeded, the pipeline SHALL split the source and translate all parts so the full document is represented in the output.

#### Scenario: Long fulltext is translated end to end

- **WHEN** an `*_en_augmented.json` file has a `fulltext` of ~24,000 characters and the operator runs translation to `es`

- **THEN** the emitted `*_en_augmented_es.json` `fulltext` covers the whole document (final section present, no mid-sentence cut) rather than a leading fragment

#### Scenario: Source beyond former cap is not dropped

- **WHEN** the English `fulltext` exceeds 20,000 characters

- **THEN** content beyond the first 20,000 characters is still translated and present in the output `fulltext`

### Requirement: Long fields are chunked on structural boundaries

When `fulltext` exceeds a configured chunk-size threshold, the pipeline SHALL split it into chunks at markdown section boundaries (headings / blank-line breaks) without splitting inside a markdown element such as a fenced code block, translate each chunk, and reassemble them preserving the original separators and markdown structure (headings, lists, links/URLs).

#### Scenario: Chunked translation preserves structure

- **WHEN** a `fulltext` with multiple `#`/`##`/`#####` headings is translated to `it`

- **THEN** the output retains the same heading hierarchy and ordering, with each section's body translated, and links/URLs preserved

#### Scenario: Short fulltext is translated in a single call

- **WHEN** a `fulltext` is below the chunk-size threshold

- **THEN** the pipeline translates it without splitting and produces complete output

### Requirement: Model reasoning budget is controlled for translation

Translation requests SHALL be configured so that model "thinking"/reasoning tokens do not starve the visible output, by setting a minimal reasoning budget appropriate to the model (for Gemini 2.5 models, `thinking_budget = 0`) together with a `max_output_tokens` large enough for a complete chunk translation. Requests SHALL complete with a normal stop reason rather than hitting the output-token limit.

#### Scenario: Translation finishes without token starvation

- **WHEN** a `fulltext` chunk is translated with the configured request settings

- **THEN** the response finishes with a normal stop reason (not `MAX_TOKENS`) and the translated chunk length is comparable to its source chunk length

### Requirement: Translation length parity is validated and reported

After translating `fulltext`, the pipeline SHALL compute the ratio of translated length to source length per document and target language, and SHALL flag documents whose ratio falls below a configurable floor (default 0.5). Flagged documents SHALL be surfaced in the multilingual search/translation report so operators can detect regressions.

#### Scenario: Below-threshold translation is flagged

- **WHEN** a translated `fulltext` is shorter than 50% of the English source length

- **THEN** the pipeline records a warning for that `(document, lang)` and the report lists it as below the parity floor

#### Scenario: Healthy translation passes validation

- **WHEN** a translated `fulltext` length ratio is within the healthy range (≈0.9–1.3 of source)

- **THEN** no parity warning is recorded for that document and language

### Requirement: Translation cache fidelity and versioning

The translation cache SHALL use a cache-key version that, when bumped, invalidates previously cached entries; this change SHALL bump the version (`v2` → `v3`) so prior truncated outputs are not reused. The pipeline SHALL NOT persist a failed or empty translation as if it were a successful final result, and chunked translations SHALL be cacheable at chunk granularity so unchanged chunks are reused on re-runs.

#### Scenario: Old truncated cache entries are not reused

- **WHEN** translation runs after the cache version bump for a document previously cached as a 176-character fragment

- **THEN** the pipeline ignores the stale `v2` entry and produces a complete `v3` translation

#### Scenario: Unchanged chunks reuse cache

- **WHEN** a document is re-translated and a given section chunk is byte-identical to a previously translated chunk for the same target language and cache version

- **THEN** that chunk's translation is loaded from cache without a new model request

### Requirement: Translation output structure is unchanged

The translation pipeline SHALL continue to emit translation-only JSON files with the existing shape and field set (`source_file`, `lang`, `title`, `subtitle`, `summary`, `fulltext`, and `recipe` when applicable). This change SHALL alter only the `fulltext` content (now complete) and SHALL NOT add, rename, or remove output fields, change the file-naming convention, or require any database schema, RPC, or explorer SQL change.

#### Scenario: Output file shape matches current contract

- **WHEN** translation produces `page_1_en_augmented_es.json`

- **THEN** the file contains exactly the existing top-level keys (`source_file`, `lang`, `title`, `subtitle`, `summary`, `fulltext`, and `recipe` when present) and is consumable by `push-climate-adapt` and `db:embed` without any schema change
