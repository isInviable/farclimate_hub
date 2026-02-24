-- Deletes all data but keeps table structures intact.
-- CASCADE propagates to all child tables (summary, summary_multilang, fulltext).
TRUNCATE knowledge.documents CASCADE;
