-- Add tsvector column for full-text search
ALTER TABLE knowledge.fulltext
  ADD COLUMN IF NOT EXISTS fts tsvector;

-- Trigger function: compute tsvector from fulltext using language-aware config
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

-- Trigger: fire before insert or update
DROP TRIGGER IF EXISTS fulltext_fts_update ON knowledge.fulltext;
CREATE TRIGGER fulltext_fts_update
  BEFORE INSERT OR UPDATE ON knowledge.fulltext
  FOR EACH ROW
  EXECUTE FUNCTION knowledge.fulltext_fts_trigger();

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS fulltext_fts_idx
  ON knowledge.fulltext USING gin(fts);

-- Backfill: touch all existing rows so the trigger populates fts
UPDATE knowledge.fulltext SET fulltext = fulltext;
