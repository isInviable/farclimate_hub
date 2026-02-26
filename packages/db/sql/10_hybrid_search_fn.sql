SET search_path TO knowledge, public, extensions;

CREATE OR REPLACE FUNCTION knowledge.hybrid_search(
  query_text text,
  query_embedding vector(768),
  match_count int DEFAULT 10,
  filter_lang text DEFAULT 'en',
  filter_content_type text DEFAULT 'composed',
  full_text_weight float DEFAULT 1,
  semantic_weight float DEFAULT 1,
  rrf_k int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  document_uid text,
  title text,
  score float,
  keyword_rank int,
  semantic_rank int
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
  WITH full_text AS (
    SELECT
      f.document_id,
      row_number() OVER (
        ORDER BY ts_rank_cd(f.fts, websearch_to_tsquery(ts_config, query_text)) DESC
      )::int AS rank_ix
    FROM knowledge.fulltext f
    WHERE f.lang = filter_lang
      AND f.fts @@ websearch_to_tsquery(ts_config, query_text)
    ORDER BY rank_ix
    LIMIT least(match_count, 30) * 2
  ),
  semantic AS (
    SELECT
      e.document_id,
      row_number() OVER (
        ORDER BY e.embedding <=> query_embedding
      )::int AS rank_ix
    FROM knowledge.embeddings e
    WHERE e.lang = filter_lang
      AND e.content_type = filter_content_type
    ORDER BY rank_ix
    LIMIT least(match_count, 30) * 2
  )
  SELECT
    d.id,
    d.document_uid,
    d.title,
    (
      coalesce(1.0 / (rrf_k + ft.rank_ix), 0.0) * full_text_weight +
      coalesce(1.0 / (rrf_k + s.rank_ix), 0.0) * semantic_weight
    )::float AS score,
    ft.rank_ix AS keyword_rank,
    s.rank_ix AS semantic_rank
  FROM full_text ft
  FULL OUTER JOIN semantic s ON ft.document_id = s.document_id
  JOIN knowledge.documents d ON d.id = coalesce(ft.document_id, s.document_id)
  ORDER BY score DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION knowledge.hybrid_search IS 'Hybrid search combining keyword (tsvector) and semantic (pgvector) results via Reciprocal Ranked Fusion.';
