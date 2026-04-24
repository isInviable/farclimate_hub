-- All knowledge tables in final form (consolidated from 01, 02, 03, 04, 06, 08, 12, 15).
-- Columns that were added in later migrations (health_impact, fts) are inlined here.

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge.documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_uid      TEXT NOT NULL UNIQUE,
  source_type       TEXT NOT NULL,
  source_url        TEXT,
  source_file       TEXT,
  title             TEXT,
  creation_date     TEXT,
  ingested_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  knowledge.documents IS 'Base document identity and source metadata. No derived content.';
COMMENT ON COLUMN knowledge.documents.document_uid IS 'Stable logical identifier, e.g. climateadapt::slug-from-url';
COMMENT ON COLUMN knowledge.documents.source_type IS 'Datasource namespace, e.g. climate_adapt_case_study';

-- ---------------------------------------------------------------------------
-- summary (includes health_impact from former migration 15)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge.summary (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id                 UUID NOT NULL UNIQUE REFERENCES knowledge.documents(id) ON DELETE CASCADE,

  -- Filterable array fields
  keywords                    TEXT[],
  climate_impacts             TEXT[],
  adaptation_approaches       TEXT[],
  sectors                     TEXT[],

  -- Structured metadata
  adapt_options               JSONB,
  geographic_characterisation JSONB,

  -- Health impact (from geographic block when present)
  health_impact               TEXT,

  -- Location
  location_lat                DOUBLE PRECISION,
  location_lon                DOUBLE PRECISION,

  -- Implementation timeline
  implementation_years_start  TEXT,
  implementation_years_end    TEXT,

  -- Preprocessed text fields (AI-cleaned)
  contact_preprocessed        TEXT,
  references_preprocessed     TEXT,

  -- Cost estimation (AI-extracted from cost_benefit text)
  cost_estimation             DOUBLE PRECISION,

  -- Structured links
  websites                    JSONB
);

COMMENT ON TABLE  knowledge.summary IS 'Structured, filterable attributes extracted from documents. 1:1 with documents.';
COMMENT ON COLUMN knowledge.summary.contact_preprocessed IS 'AI-cleaned contact information (from augmentation pipeline)';
COMMENT ON COLUMN knowledge.summary.references_preprocessed IS 'AI-cleaned references text (from augmentation pipeline)';
COMMENT ON COLUMN knowledge.summary.health_impact IS 'Health impact value from geographic block when present (Climate-ADAPT case studies).';
COMMENT ON COLUMN knowledge.summary.cost_estimation IS 'Numeric project cost in EUR extracted by AI from the cost_benefit free-text field (augmentation pipeline). NULL when no clear cost is present.';

-- GIN indexes on filterable array fields
CREATE INDEX IF NOT EXISTS summary_sectors_gin
  ON knowledge.summary USING GIN (sectors);
CREATE INDEX IF NOT EXISTS summary_climate_impacts_gin
  ON knowledge.summary USING GIN (climate_impacts);
CREATE INDEX IF NOT EXISTS summary_adaptation_approaches_gin
  ON knowledge.summary USING GIN (adaptation_approaches);
CREATE INDEX IF NOT EXISTS summary_keywords_gin
  ON knowledge.summary USING GIN (keywords);

-- ---------------------------------------------------------------------------
-- summary_multilang
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge.summary_multilang (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE,
  lang          TEXT NOT NULL,
  title         TEXT,
  subtitle      TEXT,
  summary       TEXT,

  UNIQUE (document_id, lang)
);

COMMENT ON TABLE knowledge.summary_multilang IS 'Translatable textual summary per document+language. Avoids schema duplication across languages.';

-- ---------------------------------------------------------------------------
-- fulltext (includes fts tsvector column from former migration 08)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge.fulltext (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE,
  lang          TEXT NOT NULL,
  fulltext      TEXT,
  fts           tsvector,

  UNIQUE (document_id, lang)
);

COMMENT ON TABLE knowledge.fulltext IS 'Full-text normalized representation per document+language. Derived/regenerable.';

CREATE INDEX IF NOT EXISTS fulltext_fts_idx
  ON knowledge.fulltext USING gin(fts);

-- ---------------------------------------------------------------------------
-- embeddings (requires vector extension from 01_schema_and_extensions)
-- ---------------------------------------------------------------------------
SET search_path TO knowledge, public, extensions;

CREATE TABLE IF NOT EXISTS knowledge.embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE,
  lang          TEXT NOT NULL,
  content_type  TEXT NOT NULL,
  model         TEXT NOT NULL,
  dimensions    INTEGER NOT NULL,
  embedding     vector(768),

  UNIQUE (document_id, lang, content_type)
);

CREATE INDEX IF NOT EXISTS embeddings_embedding_idx
  ON knowledge.embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

COMMENT ON TABLE  knowledge.embeddings IS 'Vector embeddings for semantic search. Derived/regenerable. Keyed by (document, lang, content_type).';
COMMENT ON COLUMN knowledge.embeddings.content_type IS 'What text was embedded, e.g. composed (title+summary+fulltext), summary_only';
COMMENT ON COLUMN knowledge.embeddings.model IS 'Embedding model used, e.g. gemini-embedding-001';
COMMENT ON COLUMN knowledge.embeddings.dimensions IS 'Dimensionality of the embedding vector';

-- ---------------------------------------------------------------------------
-- recipe (standardized sections per document+language, LLM-extracted)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge.recipe (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE,
  lang          TEXT NOT NULL,
  ingredients   JSONB NOT NULL,

  UNIQUE (document_id, lang)
);

COMMENT ON TABLE knowledge.recipe IS 'Recipe-style standardized sections (ingredients) from case-study text; regenerable; one row per (document, lang).';
COMMENT ON COLUMN knowledge.recipe.lang IS 'Language of extraction, e.g. en from English augmentation pass.';
COMMENT ON COLUMN knowledge.recipe.ingredients IS 'JSON object with canonical string keys: who_is_involved, economic_data, context_summary, challenges, policy_context, legal_aspects, objectives, solutions_implemented, implementation_phases, success_and_limiting, benefits, lessons_learnt, transferability.';

-- ---------------------------------------------------------------------------
-- document_images (hero + gallery images per document, ordered by position)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge.document_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE,
  position      INT  NOT NULL,
  source_url    TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  public_url    TEXT NOT NULL,
  title         TEXT,
  description   TEXT,
  credits       TEXT,
  content_type  TEXT,
  width         INT,
  height        INT,
  bytes         INT,

  UNIQUE (document_id, position)
);

CREATE INDEX IF NOT EXISTS document_images_document_id_position_idx
  ON knowledge.document_images (document_id, position);

COMMENT ON TABLE  knowledge.document_images IS 'Ordered hero + gallery images per document, mirrored to the article-images Supabase Storage bucket. Position 0 is the hero when one exists.';
COMMENT ON COLUMN knowledge.document_images.position IS '0-based ordering within the document; position 0 is the hero when a primary photo is available.';
COMMENT ON COLUMN knowledge.document_images.source_url IS 'Original Climate-ADAPT URL the binary was downloaded from (best-available scale).';
COMMENT ON COLUMN knowledge.document_images.storage_path IS 'Path inside the article-images Supabase Storage bucket, e.g. climateadapt/<slug>/00.png.';
COMMENT ON COLUMN knowledge.document_images.public_url IS 'Public URL to the stored object (bucket is public-read).';
COMMENT ON COLUMN knowledge.document_images.credits IS 'Attribution / rights text (e.g. primary_photo_copyright for hero, cca_gallery[i].rights for gallery).';
