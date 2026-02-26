SET search_path TO knowledge, public, extensions;

CREATE OR REPLACE FUNCTION knowledge.match_documents(
  query_embedding vector(768),
  match_count int DEFAULT 10,
  filter_lang text DEFAULT 'en',
  filter_content_type text DEFAULT 'composed'
)
RETURNS TABLE (
  id uuid,
  document_uid text,
  title text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    d.id,
    d.document_uid,
    d.title,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM knowledge.embeddings e
  JOIN knowledge.documents d ON d.id = e.document_id
  WHERE e.lang = filter_lang
    AND e.content_type = filter_content_type
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION knowledge.match_documents IS 'Semantic search: returns top-N documents ranked by cosine similarity to the query embedding.';
