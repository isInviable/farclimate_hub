## ADDED Requirements

### Requirement: Add tsvector column to fulltext table

The system SHALL add a nullable `fts` column of type `tsvector` to the `knowledge.fulltext` table. This column stores the pre-computed full-text search index for the `fulltext` text column.

#### Scenario: Column exists after migration
- **WHEN** `db:create` runs
- **THEN** the `knowledge.fulltext` table SHALL have a column `fts` of type `tsvector`

#### Scenario: Idempotent migration
- **WHEN** `db:create` runs and the column already exists
- **THEN** the migration SHALL succeed without errors

### Requirement: Auto-compute tsvector via trigger

The system SHALL create a trigger function `knowledge.fulltext_fts_trigger()` that fires BEFORE INSERT OR UPDATE on `knowledge.fulltext`. The trigger SHALL compute `NEW.fts` from `NEW.fulltext` using a text search configuration determined by `NEW.lang`:
- `'en'` → `'english'`
- `'es'` → `'spanish'`
- any other value → `'simple'`

If `NEW.fulltext` is NULL or empty, `NEW.fts` SHALL be set to NULL.

#### Scenario: English document inserted
- **WHEN** a row is inserted into `knowledge.fulltext` with `lang = 'en'` and non-empty fulltext
- **THEN** the `fts` column SHALL be populated with `to_tsvector('english', fulltext)`

#### Scenario: Spanish document inserted
- **WHEN** a row is inserted into `knowledge.fulltext` with `lang = 'es'` and non-empty fulltext
- **THEN** the `fts` column SHALL be populated with `to_tsvector('spanish', fulltext)`

#### Scenario: Unknown language
- **WHEN** a row is inserted with `lang = 'fr'` (not yet mapped)
- **THEN** the `fts` column SHALL be populated with `to_tsvector('simple', fulltext)`

#### Scenario: Null fulltext
- **WHEN** a row is inserted with `fulltext = NULL`
- **THEN** the `fts` column SHALL be NULL

#### Scenario: Update triggers recomputation
- **WHEN** a row's `fulltext` is updated
- **THEN** the `fts` column SHALL be recomputed using the current `lang` value

### Requirement: GIN index on fts column

The system SHALL create a GIN index on `knowledge.fulltext.fts` for fast full-text search queries.

#### Scenario: Index exists after migration
- **WHEN** `db:create` runs
- **THEN** a GIN index SHALL exist on `knowledge.fulltext.fts`

### Requirement: Backfill existing rows

After the trigger and column are created, the system SHALL backfill the `fts` column for all existing rows in `knowledge.fulltext` by triggering the trigger on each row.

#### Scenario: Existing data populated
- **WHEN** the backfill migration runs
- **THEN** all existing rows in `knowledge.fulltext` with non-null `fulltext` SHALL have a non-null `fts` value

### Requirement: Provide keyword_search RPC function

The system SHALL create a Postgres function `knowledge.keyword_search` that accepts:
- `query_text` (text) — the user's search string
- `match_count` (int, default 10)
- `filter_lang` (text, default 'en')

The function SHALL use `websearch_to_tsquery` to parse the query text and search against the `fts` column. Results SHALL be ranked by `ts_rank_cd` and return:
- `id` (UUID) — the document id
- `document_uid` (TEXT)
- `title` (TEXT)
- `rank` (FLOAT) — the ts_rank_cd score

#### Scenario: Basic keyword search
- **WHEN** a client calls `knowledge.keyword_search('flood protection', 5, 'en')`
- **THEN** the function SHALL return up to 5 English documents whose fulltext matches "flood protection", ordered by relevance

#### Scenario: No matching documents
- **WHEN** the query matches no documents
- **THEN** the function SHALL return an empty result set

#### Scenario: Language-filtered search
- **WHEN** a client calls `keyword_search` with `filter_lang = 'es'`
- **THEN** only rows where `lang = 'es'` SHALL be searched

#### Scenario: Supabase RPC invocation
- **WHEN** the web app calls `supabase.rpc('keyword_search', { query_text: 'flood', match_count: 10 })`
- **THEN** the function SHALL be accessible and return correctly typed results
