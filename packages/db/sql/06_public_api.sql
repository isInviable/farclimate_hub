-- Public schema wrappers and grants (consolidated from 11 + public wrappers from 13, 14).
-- PostgREST exposes public schema by default; these delegate to knowledge schema.
-- Drop existing functions so return types can change across migrations (e.g. adding health_impact).
DROP FUNCTION IF EXISTS public.hybrid_search(text, text, int, text, text, float, float, int);
DROP FUNCTION IF EXISTS public.hybrid_search(text, text, int, text, text, float, float, int, float);
DROP FUNCTION IF EXISTS public.keyword_search(text, int, text);
DROP FUNCTION IF EXISTS public.get_all_documents(text);
DROP FUNCTION IF EXISTS public.get_documents_by_ids(uuid[], text);
DROP FUNCTION IF EXISTS public.get_document_by_uid(text, text);
DROP FUNCTION IF EXISTS public.get_filter_facets(uuid[]);
DROP FUNCTION IF EXISTS public.get_summary_facet_arrays(uuid[]);

CREATE OR REPLACE FUNCTION public.hybrid_search(
  query_text text,
  query_embedding text,
  match_count int DEFAULT 10,
  filter_lang text DEFAULT 'en',
  filter_content_type text DEFAULT 'composed',
  full_text_weight float DEFAULT 1,
  semantic_weight float DEFAULT 1,
  rrf_k int DEFAULT 50,
  match_threshold float DEFAULT 0.0
)
RETURNS TABLE (
  id uuid,
  document_uid text,
  title text,
  score float,
  keyword_rank int,
  semantic_rank int
)
LANGUAGE sql STABLE
SET search_path = knowledge, public, extensions
AS $$
  SELECT * FROM knowledge.hybrid_search(
    query_text,
    query_embedding::vector(768),
    match_count,
    filter_lang,
    filter_content_type,
    full_text_weight,
    semantic_weight,
    rrf_k,
    match_threshold
  );
$$;

CREATE OR REPLACE FUNCTION public.keyword_search(
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
LANGUAGE sql STABLE
SET search_path = knowledge, public, extensions
AS $$
  SELECT * FROM knowledge.keyword_search(query_text, match_count, filter_lang);
$$;

CREATE OR REPLACE FUNCTION public.get_all_documents(
  filter_lang text DEFAULT 'en'
)
RETURNS TABLE (
  id uuid,
  document_uid text,
  title text,
  source_url text,
  images jsonb,
  summary text,
  subtitle text,
  fulltext text,
  keywords text[],
  climate_impacts text[],
  adaptation_approaches text[],
  sectors text[],
  geographic_characterisation jsonb,
  health_impact text,
  location_lat double precision,
  location_lon double precision,
  implementation_years_start text,
  implementation_years_end text,
  contact_preprocessed text,
  references_preprocessed text,
  websites jsonb,
  recipe_ingredients jsonb
)
LANGUAGE sql STABLE
AS $$
  SELECT
    d.id,
    d.document_uid,
    COALESCE(ml.title, d.title) AS title,
    d.source_url,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'position',     di.position,
            'public_url',   di.public_url,
            'source_url',   di.source_url,
            'title',        di.title,
            'description',  di.description,
            'credits',      di.credits,
            'content_type', di.content_type,
            'width',        di.width,
            'height',       di.height,
            'bytes',        di.bytes
          ) ORDER BY di.position
        )
        FROM knowledge.document_images di
        WHERE di.document_id = d.id
      ),
      '[]'::jsonb
    ) AS images,
    ml.summary,
    ml.subtitle,
    f.fulltext,
    s.keywords,
    s.climate_impacts,
    s.adaptation_approaches,
    s.sectors,
    s.geographic_characterisation,
    s.health_impact,
    s.location_lat,
    s.location_lon,
    s.implementation_years_start,
    s.implementation_years_end,
    s.contact_preprocessed,
    s.references_preprocessed,
    s.websites,
    r.ingredients AS recipe_ingredients
  FROM knowledge.documents d
  LEFT JOIN knowledge.summary s ON s.document_id = d.id
  LEFT JOIN knowledge.summary_multilang ml ON ml.document_id = d.id AND ml.lang = filter_lang
  LEFT JOIN knowledge.fulltext f ON f.document_id = d.id AND f.lang = filter_lang
  LEFT JOIN knowledge.recipe r ON r.document_id = d.id AND r.lang = filter_lang
  ORDER BY d.title;
$$;

CREATE OR REPLACE FUNCTION public.get_documents_by_ids(
  doc_ids uuid[],
  filter_lang text DEFAULT 'en'
)
RETURNS TABLE (
  id uuid,
  document_uid text,
  title text,
  source_url text,
  images jsonb,
  summary text,
  subtitle text,
  fulltext text,
  keywords text[],
  climate_impacts text[],
  adaptation_approaches text[],
  sectors text[],
  geographic_characterisation jsonb,
  health_impact text,
  location_lat double precision,
  location_lon double precision,
  implementation_years_start text,
  implementation_years_end text,
  contact_preprocessed text,
  references_preprocessed text,
  websites jsonb,
  recipe_ingredients jsonb
)
LANGUAGE sql STABLE
AS $$
  SELECT
    d.id,
    d.document_uid,
    COALESCE(ml.title, d.title) AS title,
    d.source_url,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'position',     di.position,
            'public_url',   di.public_url,
            'source_url',   di.source_url,
            'title',        di.title,
            'description',  di.description,
            'credits',      di.credits,
            'content_type', di.content_type,
            'width',        di.width,
            'height',       di.height,
            'bytes',        di.bytes
          ) ORDER BY di.position
        )
        FROM knowledge.document_images di
        WHERE di.document_id = d.id
      ),
      '[]'::jsonb
    ) AS images,
    ml.summary,
    ml.subtitle,
    f.fulltext,
    s.keywords,
    s.climate_impacts,
    s.adaptation_approaches,
    s.sectors,
    s.geographic_characterisation,
    s.health_impact,
    s.location_lat,
    s.location_lon,
    s.implementation_years_start,
    s.implementation_years_end,
    s.contact_preprocessed,
    s.references_preprocessed,
    s.websites,
    r.ingredients AS recipe_ingredients
  FROM knowledge.documents d
  LEFT JOIN knowledge.summary s ON s.document_id = d.id
  LEFT JOIN knowledge.summary_multilang ml ON ml.document_id = d.id AND ml.lang = filter_lang
  LEFT JOIN knowledge.fulltext f ON f.document_id = d.id AND f.lang = filter_lang
  LEFT JOIN knowledge.recipe r ON r.document_id = d.id AND r.lang = filter_lang
  WHERE d.id = ANY(doc_ids);
$$;

/** Single document by stable `document_uid` (e.g. for explorer deep links from pins). */
CREATE OR REPLACE FUNCTION public.get_document_by_uid(
  p_document_uid text,
  filter_lang text DEFAULT 'en'
)
RETURNS TABLE (
  id uuid,
  document_uid text,
  title text,
  source_url text,
  images jsonb,
  summary text,
  subtitle text,
  fulltext text,
  keywords text[],
  climate_impacts text[],
  adaptation_approaches text[],
  sectors text[],
  geographic_characterisation jsonb,
  health_impact text,
  location_lat double precision,
  location_lon double precision,
  implementation_years_start text,
  implementation_years_end text,
  contact_preprocessed text,
  references_preprocessed text,
  websites jsonb,
  recipe_ingredients jsonb
)
LANGUAGE sql STABLE
AS $$
  SELECT
    d.id,
    d.document_uid,
    COALESCE(ml.title, d.title) AS title,
    d.source_url,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'position',     di.position,
            'public_url',   di.public_url,
            'source_url',   di.source_url,
            'title',        di.title,
            'description',  di.description,
            'credits',      di.credits,
            'content_type', di.content_type,
            'width',        di.width,
            'height',       di.height,
            'bytes',        di.bytes
          ) ORDER BY di.position
        )
        FROM knowledge.document_images di
        WHERE di.document_id = d.id
      ),
      '[]'::jsonb
    ) AS images,
    ml.summary,
    ml.subtitle,
    f.fulltext,
    s.keywords,
    s.climate_impacts,
    s.adaptation_approaches,
    s.sectors,
    s.geographic_characterisation,
    s.health_impact,
    s.location_lat,
    s.location_lon,
    s.implementation_years_start,
    s.implementation_years_end,
    s.contact_preprocessed,
    s.references_preprocessed,
    s.websites,
    r.ingredients AS recipe_ingredients
  FROM knowledge.documents d
  LEFT JOIN knowledge.summary s ON s.document_id = d.id
  LEFT JOIN knowledge.summary_multilang ml ON ml.document_id = d.id AND ml.lang = filter_lang
  LEFT JOIN knowledge.fulltext f ON f.document_id = d.id AND f.lang = filter_lang
  LEFT JOIN knowledge.recipe r ON r.document_id = d.id AND r.lang = filter_lang
  WHERE d.document_uid = p_document_uid
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_document_by_uid(text, text) IS 'Load one knowledge document by stable document_uid for deep links.';

CREATE OR REPLACE FUNCTION public.get_filter_facets(doc_ids uuid[] DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = knowledge, public, extensions
AS $$
  SELECT knowledge.get_filter_facets(doc_ids);
$$;

COMMENT ON FUNCTION public.get_filter_facets(uuid[]) IS 'Public wrapper for filter facets; delegates to knowledge.get_filter_facets.';

CREATE OR REPLACE FUNCTION public.get_summary_facet_arrays(doc_ids uuid[])
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
  SELECT * FROM knowledge.get_summary_facet_arrays(doc_ids);
$$;

COMMENT ON FUNCTION public.get_summary_facet_arrays(uuid[]) IS 'Public wrapper for get_summary_facet_arrays.';

-- Grant knowledge schema access to PostgREST roles
GRANT USAGE ON SCHEMA knowledge TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA knowledge TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA knowledge GRANT SELECT ON TABLES TO anon, authenticated;
