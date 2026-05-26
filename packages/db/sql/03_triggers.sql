-- Shared FTS text-search config for index (trigger) and query (search RPCs).
CREATE OR REPLACE FUNCTION knowledge.ts_config_for_lang(lang text)
RETURNS regconfig
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lang
    WHEN 'en' THEN 'english'::regconfig
    WHEN 'es' THEN 'spanish'::regconfig
    WHEN 'it' THEN 'italian'::regconfig
    ELSE 'simple'::regconfig
  END;
$$;

COMMENT ON FUNCTION knowledge.ts_config_for_lang IS
  'Maps knowledge.fulltext.lang to PostgreSQL text search config for indexing and querying.';

-- Trigger: compute tsvector from fulltext on insert/update (from former migration 08, no backfill).
CREATE OR REPLACE FUNCTION knowledge.fulltext_fts_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.fulltext IS NULL OR trim(NEW.fulltext) = '' THEN
    NEW.fts := NULL;
    RETURN NEW;
  END IF;

  NEW.fts := to_tsvector(knowledge.ts_config_for_lang(NEW.lang), NEW.fulltext);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fulltext_fts_update ON knowledge.fulltext;
CREATE TRIGGER fulltext_fts_update
  BEFORE INSERT OR UPDATE ON knowledge.fulltext
  FOR EACH ROW
  EXECUTE FUNCTION knowledge.fulltext_fts_trigger();
