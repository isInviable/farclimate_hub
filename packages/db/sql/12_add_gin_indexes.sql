-- GIN indexes on filterable array fields of knowledge.summary.
-- Enables efficient && (overlap) and @> (contains) queries for tag filtering.
-- Idempotent: safe on empty DB, existing DB, and re-runs.

CREATE INDEX IF NOT EXISTS summary_sectors_gin
  ON knowledge.summary USING GIN (sectors);

CREATE INDEX IF NOT EXISTS summary_climate_impacts_gin
  ON knowledge.summary USING GIN (climate_impacts);

CREATE INDEX IF NOT EXISTS summary_adaptation_approaches_gin
  ON knowledge.summary USING GIN (adaptation_approaches);

CREATE INDEX IF NOT EXISTS summary_keywords_gin
  ON knowledge.summary USING GIN (keywords);
