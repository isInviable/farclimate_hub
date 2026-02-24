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

  -- Location
  location_lat                DOUBLE PRECISION,
  location_lon                DOUBLE PRECISION,

  -- Implementation timeline
  implementation_years_start  TEXT,
  implementation_years_end    TEXT,

  -- Preprocessed text fields (AI-cleaned)
  contact_preprocessed        TEXT,
  references_preprocessed     TEXT,

  -- Structured links
  websites                    JSONB
);

COMMENT ON TABLE  knowledge.summary IS 'Structured, filterable attributes extracted from documents. 1:1 with documents.';
COMMENT ON COLUMN knowledge.summary.contact_preprocessed IS 'AI-cleaned contact information (from augmentation pipeline)';
COMMENT ON COLUMN knowledge.summary.references_preprocessed IS 'AI-cleaned references text (from augmentation pipeline)';
