CREATE OR REPLACE FUNCTION knowledge.keyword_search(
  query_text text,
  match_count int DEFAULT 10,
  filter_lang text DEFAULT 'en'
)
RETURNS TABLE (
  id uuid,
  document_uid text,
  title text,
  rank float
)
LANGUAGE plpgsql STABLE
SET search_path = knowledge, public, extensions
AS $$
DECLARE
  ts_config regconfig;
BEGIN
  CASE filter_lang
    WHEN 'en' THEN ts_config := 'english';
    WHEN 'es' THEN ts_config := 'spanish';
    ELSE ts_config := 'simple';
  END CASE;

  RETURN QUERY
  SELECT
    d.id,
    d.document_uid,
    d.title,
    ts_rank_cd(f.fts, websearch_to_tsquery(ts_config, query_text))::float AS rank
  FROM knowledge.fulltext f
  JOIN knowledge.documents d ON d.id = f.document_id
  WHERE f.lang = filter_lang
    AND f.fts @@ websearch_to_tsquery(ts_config, query_text)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION knowledge.keyword_search IS 'Full-text keyword search over document content. Returns documents ranked by ts_rank_cd relevance.';
