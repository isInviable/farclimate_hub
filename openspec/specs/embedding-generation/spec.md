### Requirement: Compose embedding input text from document fields

The system SHALL compose the embedding input text by concatenating `title`, `summary`, and a truncated `fulltext` (max 6000 characters), separated by double newlines. Missing fields SHALL be treated as empty strings. The composed text SHALL be trimmed of leading/trailing whitespace.

#### Scenario: All fields present
- **WHEN** a document has title "Climate bonds in Paris", a 200-word summary, and a 10000-char fulltext
- **THEN** the embedding input text SHALL be `title + "\n\n" + summary + "\n\n" + fulltext[:6000]`

#### Scenario: Missing summary
- **WHEN** a document has a title and fulltext but no summary field
- **THEN** the embedding input text SHALL be `title + "\n\n" + fulltext[:6000]` (empty summary omitted from the join)

#### Scenario: Empty document
- **WHEN** a document has no title, no summary, and no fulltext
- **THEN** the system SHALL skip embedding generation for that document and log a warning

### Requirement: Call Gemini Embedding API with correct parameters

The system SHALL call the Google Gemini API using model `gemini-embedding-001` with `outputDimensionality` set to 768 and `taskType` set to `RETRIEVAL_DOCUMENT`. The model name and dimensions SHALL be configurable via environment variables `GEMINI_EMBEDDING_MODEL` and `GEMINI_EMBEDDING_DIMENSIONS` with defaults of `gemini-embedding-001` and `768` respectively.

#### Scenario: Successful API call
- **WHEN** the system sends a non-empty composed text to the Gemini Embedding API
- **THEN** it SHALL receive a float array of length equal to the configured dimensions (768 by default)

#### Scenario: API key missing
- **WHEN** `GEMINI_API_KEY` is not set in the environment
- **THEN** the script SHALL exit with an error message indicating the missing key

#### Scenario: API error
- **WHEN** the Gemini API returns an error (rate limit, model not found, etc.)
- **THEN** the system SHALL log the error, skip that document's embedding, and continue processing remaining documents

### Requirement: Cache embedding results to avoid redundant API calls

The system SHALL maintain a JSON cache file at `pipeline/caches/embeddings_cache.json`. The cache key SHALL be `sha256(model + ":" + dimensions + ":" + composed_text)`. On each embedding request, the system SHALL check the cache first and only call the API on a cache miss. After a successful API call, the result SHALL be written to the cache immediately.

#### Scenario: Cache hit
- **WHEN** the composed text, model, and dimensions match an existing cache entry
- **THEN** the system SHALL use the cached embedding vector without calling the API

#### Scenario: Cache miss
- **WHEN** no matching cache entry exists
- **THEN** the system SHALL call the Gemini API, store the result in the cache, and return the embedding

#### Scenario: Cache file does not exist
- **WHEN** `pipeline/caches/embeddings_cache.json` does not exist on first run
- **THEN** the system SHALL create it after the first successful embedding

### Requirement: Upsert embeddings into the database during push

The `push-climate-adapt.ts` script SHALL compute embeddings for each English augmented document and upsert them into `knowledge.embeddings` with `lang='en'` and `content_type='composed'`. The upsert SHALL use `ON CONFLICT (document_id, lang, content_type) DO UPDATE` to be idempotent.

#### Scenario: First push with embeddings
- **WHEN** `db:push` runs for the first time with the embeddings table present
- **THEN** each document SHALL have one row in `knowledge.embeddings` with its computed vector

#### Scenario: Re-push after content change
- **WHEN** `db:push` runs again and a document's fulltext has changed
- **THEN** the embedding SHALL be recomputed (cache miss due to content change) and the row updated

### Requirement: Standalone embedding script

The system SHALL provide a standalone script `packages/db/src/generate-embeddings.ts` runnable via `npm run db:embed` that reads all documents from `knowledge.documents`, fetches their text from `knowledge.summary_multilang` and `knowledge.fulltext`, computes embeddings, and upserts into `knowledge.embeddings`. This script SHALL operate independently from `push-climate-adapt.ts`.

#### Scenario: Re-embed after model change
- **WHEN** the user changes `GEMINI_EMBEDDING_MODEL` to a new model and runs `db:embed`
- **THEN** all embeddings SHALL be recomputed with the new model and the `model` column updated

#### Scenario: Re-embed with different dimensions
- **WHEN** the user sets `GEMINI_EMBEDDING_DIMENSIONS=1536` and runs `db:embed`
- **THEN** all embeddings SHALL be recomputed at 1536 dimensions, the `dimensions` column updated, and the vector column re-created with the new size
