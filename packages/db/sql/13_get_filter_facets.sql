-- Filter facets: unique values + counts for sectors, climate_impacts, adaptation_approaches, keywords.
-- Returns JSONB with "global" (whole table) and "for_result_set" (when doc_ids provided).
-- Idempotent: CREATE OR REPLACE.

SET search_path TO knowledge, public, extensions;

-- Helper: build facet array for one array column from a given base (table or filtered).
-- We use inline subqueries per category to keep SQL readable.

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

-- Public wrapper for PostgREST/Supabase
CREATE OR REPLACE FUNCTION public.get_filter_facets(doc_ids uuid[] DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = knowledge, public, extensions
AS $$
  SELECT knowledge.get_filter_facets(doc_ids);
$$;

COMMENT ON FUNCTION public.get_filter_facets(uuid[]) IS 'Public wrapper for filter facets; delegates to knowledge.get_filter_facets.';
