-- Facet functions in knowledge schema only (consolidated from 13, 14). Public wrappers are in 06_public_api.
SET search_path TO knowledge, public;

-- Derive biogeographical_regions (text[]) from geographic_characterisation JSONB.
-- String → split by comma, trim; array → elements; null/missing/empty → ARRAY['no-identificados'].
CREATE OR REPLACE FUNCTION knowledge.biogeographical_regions_from_geo(geo jsonb)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = knowledge, public
AS $$
  SELECT CASE
    WHEN geo IS NULL OR geo->'biogeographical_regions' IS NULL THEN ARRAY['no-identificados']::text[]
    WHEN jsonb_typeof(geo->'biogeographical_regions') = 'array' THEN
      COALESCE(
        (SELECT array_agg(trim(elem)) FROM jsonb_array_elements_text(geo->'biogeographical_regions') AS elem WHERE trim(elem) <> ''),
        ARRAY['no-identificados']::text[]
      )
    WHEN jsonb_typeof(geo->'biogeographical_regions') = 'string' THEN
      COALESCE(
        (SELECT array_agg(trim(x)) FROM unnest(string_to_array(geo->>'biogeographical_regions', ',')) AS x WHERE trim(x) <> ''),
        ARRAY['no-identificados']::text[]
      )
    ELSE ARRAY['no-identificados']::text[]
  END;
$$;

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
      ),
      'biogeographical_regions', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('value', val, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
        FROM (
          SELECT val, count(*)::int AS cnt
          FROM (SELECT unnest(knowledge.biogeographical_regions_from_geo(geographic_characterisation)) AS val FROM knowledge.summary) sub
          GROUP BY val
          ORDER BY cnt DESC
        ) o
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
          ),
          'biogeographical_regions', (
            SELECT coalesce(jsonb_agg(jsonb_build_object('value', val, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
            FROM (
              SELECT val, count(*)::int AS cnt
              FROM (SELECT unnest(knowledge.biogeographical_regions_from_geo(geographic_characterisation)) AS val FROM knowledge.summary WHERE document_id = ANY(doc_ids)) sub
              GROUP BY val
              ORDER BY cnt DESC
            ) o
          )
        )
      ELSE jsonb_build_object(
        'sectors', '[]'::jsonb,
        'climate_impacts', '[]'::jsonb,
        'adaptation_approaches', '[]'::jsonb,
        'keywords', '[]'::jsonb,
        'biogeographical_regions', '[]'::jsonb
      )
    END
  );
$$;

COMMENT ON FUNCTION knowledge.get_filter_facets(uuid[]) IS 'Returns filter facets (value + count) for sectors, climate_impacts, adaptation_approaches, keywords, biogeographical_regions. global=whole table; for_result_set=when doc_ids provided.';

CREATE OR REPLACE FUNCTION knowledge.get_summary_facet_arrays(doc_ids uuid[])
RETURNS TABLE (
  document_id uuid,
  sectors text[],
  climate_impacts text[],
  adaptation_approaches text[],
  keywords text[],
  biogeographical_regions text[]
)
LANGUAGE sql
STABLE
SET search_path = knowledge, public
AS $$
  SELECT
    s.document_id,
    s.sectors,
    s.climate_impacts,
    s.adaptation_approaches,
    s.keywords,
    knowledge.biogeographical_regions_from_geo(s.geographic_characterisation) AS biogeographical_regions
  FROM knowledge.summary s
  WHERE s.document_id = ANY(doc_ids);
$$;

COMMENT ON FUNCTION knowledge.get_summary_facet_arrays(uuid[]) IS 'Returns facet arrays per document for the given ids; used by search API to apply facet filters. biogeographical_regions derived from geographic_characterisation JSONB.';
