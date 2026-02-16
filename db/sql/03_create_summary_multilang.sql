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
