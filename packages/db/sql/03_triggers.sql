-- Trigger: compute tsvector from fulltext on insert/update (from former migration 08, no backfill).
CREATE OR REPLACE FUNCTION knowledge.fulltext_fts_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ts_config regconfig;
BEGIN
  IF NEW.fulltext IS NULL OR trim(NEW.fulltext) = '' THEN
    NEW.fts := NULL;
    RETURN NEW;
  END IF;

  CASE NEW.lang
    WHEN 'en' THEN ts_config := 'english';
    WHEN 'es' THEN ts_config := 'spanish';
    ELSE ts_config := 'simple';
  END CASE;

  NEW.fts := to_tsvector(ts_config, NEW.fulltext);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fulltext_fts_update ON knowledge.fulltext;
CREATE TRIGGER fulltext_fts_update
  BEFORE INSERT OR UPDATE ON knowledge.fulltext
  FOR EACH ROW
  EXECUTE FUNCTION knowledge.fulltext_fts_trigger();
