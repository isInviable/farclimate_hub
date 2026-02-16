CREATE TABLE IF NOT EXISTS knowledge.documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_uid      TEXT NOT NULL UNIQUE,
  source_type       TEXT NOT NULL,
  source_url        TEXT,
  source_file       TEXT,
  title             TEXT,
  image_url         TEXT,
  creation_date     TEXT,
  ingested_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  knowledge.documents IS 'Base document identity and source metadata. No derived content.';
COMMENT ON COLUMN knowledge.documents.document_uid IS 'Stable logical identifier, e.g. climateadapt::slug-from-url';
COMMENT ON COLUMN knowledge.documents.source_type IS 'Datasource namespace, e.g. climate_adapt_case_study';
