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
