-- Deletes all data but keeps table structures intact.
-- CASCADE propagates to child tables (summary, summary_multilang, fulltext, recipe, embeddings, etc.).
TRUNCATE knowledge.documents CASCADE;
