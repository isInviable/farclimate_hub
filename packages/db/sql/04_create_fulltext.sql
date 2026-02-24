CREATE TABLE IF NOT EXISTS knowledge.fulltext (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE,
  lang          TEXT NOT NULL,
  fulltext      TEXT,

  UNIQUE (document_id, lang)
);

COMMENT ON TABLE knowledge.fulltext IS 'Full-text normalized representation per document+language. Derived/regenerable.';
