-- One-time: recompute fts for Italian rows after ts_config_for_lang includes italian.
-- Prerequisite: run 03_triggers.sql (updated trigger) first.
-- Not included in db:create — run via: pnpm db:backfill-italian-fts

UPDATE knowledge.fulltext
SET fulltext = fulltext
WHERE lang = 'it'
  AND fulltext IS NOT NULL
  AND trim(fulltext) <> '';
