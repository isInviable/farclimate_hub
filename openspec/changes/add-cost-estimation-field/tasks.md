## 1. Pipeline — cost estimation extraction function

- [x] 1.1 Add `COST_ESTIMATION_CACHE_FILE` constant and load `global_cost_estimation_cache` at module level in `augment_with_ai.py`
- [x] 1.2 Implement `extract_cost_estimation(cost_benefit_text: str) -> float | None` with Gemini call, JSON parsing, and versioned caching (`v1:` prefix)
- [x] 1.3 Integrate `extract_cost_estimation` call in `augment_record()` — read `cost_benefit` field, write `cost_estimation` to the output dict

## 2. Database schema

- [x] 2.1 Add `cost_estimation DOUBLE PRECISION` column to `knowledge.summary` in `packages/db/sql/02_tables.sql` (after `references_preprocessed`, before `websites`)
- [x] 2.2 Add a `COMMENT ON COLUMN` for the new column explaining its origin

## 3. Data ingestion

- [x] 3.1 Update `upsertSummary()` in `packages/db/src/push-climate-adapt.ts` to read `cost_estimation` from the augmented JSON and include it in the INSERT/ON CONFLICT statement

## 4. Verification

- [x] 4.1 Run `augment_with_ai.py` on a sample file and confirm the augmented JSON contains `cost_estimation` (numeric or `null`)
- [x] 4.2 Verify `cost_estimation_cache.json` is created in `pipeline/caches/`
- [ ] 4.3 Recreate the database and run `push-climate-adapt` — confirm the `cost_estimation` column is populated
