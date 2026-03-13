-- Facet functions in knowledge schema only (consolidated from 13, 14). Public wrappers are in 06_public_api.
SET search_path TO knowledge, public;

CREATE OR REPLACE FUNCTION knowledge.get_filter_facets(doc_ids uuid[] DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = knowledge, public
AS $$
  SELECT jsonb_build_object(
    'global', jsonb_build_object(
      'sectors', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('value', val, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
        FROM (SELECT val, count(*)::int AS cnt FROM (SELECT unnest(COALESCE(sectors, '{}')) AS val FROM knowledge.summary) sub GROUP BY val ORDER BY cnt DESC) o
      ),
      'climate_impacts', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('value', val, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
        FROM (SELECT val, count(*)::int AS cnt FROM (SELECT unnest(COALESCE(climate_impacts, '{}')) AS val FROM knowledge.summary) sub GROUP BY val ORDER BY cnt DESC) o
      ),
      'adaptation_approaches', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('value', val, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
        FROM (SELECT val, count(*)::int AS cnt FROM (SELECT unnest(COALESCE(adaptation_approaches, '{}')) AS val FROM knowledge.summary) sub GROUP BY val ORDER BY cnt DESC) o
      ),
      'keywords', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('value', val, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
        FROM (SELECT val, count(*)::int AS cnt FROM (SELECT unnest(COALESCE(keywords, '{}')) AS val FROM knowledge.summary) sub GROUP BY val ORDER BY cnt DESC) o
      )
    ),
    'for_result_set', CASE
      WHEN doc_ids IS NOT NULL AND array_length(doc_ids, 1) > 0 THEN
        jsonb_build_object(
          'sectors', (
            SELECT coalesce(jsonb_agg(jsonb_build_object('value', val, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
            FROM (SELECT val, count(*)::int AS cnt FROM (SELECT unnest(COALESCE(sectors, '{}')) AS val FROM knowledge.summary WHERE document_id = ANY(doc_ids)) sub GROUP BY val ORDER BY cnt DESC) o
          ),
          'climate_impacts', (
            SELECT coalesce(jsonb_agg(jsonb_build_object('value', val, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
            FROM (SELECT val, count(*)::int AS cnt FROM (SELECT unnest(COALESCE(climate_impacts, '{}')) AS val FROM knowledge.summary WHERE document_id = ANY(doc_ids)) sub GROUP BY val ORDER BY cnt DESC) o
          ),
          'adaptation_approaches', (
            SELECT coalesce(jsonb_agg(jsonb_build_object('value', val, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
            FROM (SELECT val, count(*)::int AS cnt FROM (SELECT unnest(COALESCE(adaptation_approaches, '{}')) AS val FROM knowledge.summary WHERE document_id = ANY(doc_ids)) sub GROUP BY val ORDER BY cnt DESC) o
          ),
          'keywords', (
            SELECT coalesce(jsonb_agg(jsonb_build_object('value', val, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
            FROM (SELECT val, count(*)::int AS cnt FROM (SELECT unnest(COALESCE(keywords, '{}')) AS val FROM knowledge.summary WHERE document_id = ANY(doc_ids)) sub GROUP BY val ORDER BY cnt DESC) o
          )
        )
      ELSE jsonb_build_object(
        'sectors', '[]'::jsonb,
        'climate_impacts', '[]'::jsonb,
        'adaptation_approaches', '[]'::jsonb,
        'keywords', '[]'::jsonb
      )
    END
  );
$$;

COMMENT ON FUNCTION knowledge.get_filter_facets(uuid[]) IS 'Returns filter facets (value + count) for sectors, climate_impacts, adaptation_approaches, keywords. global=whole table; for_result_set=when doc_ids provided.';

CREATE OR REPLACE FUNCTION knowledge.get_summary_facet_arrays(doc_ids uuid[])
RETURNS TABLE (
  document_id uuid,
  sectors text[],
  climate_impacts text[],
  adaptation_approaches text[],
  keywords text[]
)
LANGUAGE sql
STABLE
SET search_path = knowledge, public
AS $$
  SELECT s.document_id, s.sectors, s.climate_impacts, s.adaptation_approaches, s.keywords
  FROM knowledge.summary s
  WHERE s.document_id = ANY(doc_ids);
$$;

COMMENT ON FUNCTION knowledge.get_summary_facet_arrays(uuid[]) IS 'Returns facet arrays per document for the given ids; used by search API to apply facet filters.';
