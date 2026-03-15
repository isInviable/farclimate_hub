## Why

The augmentation pipeline (`augment_with_ai.py`) already extracts several AI-derived fields from case-study data (years, summary, geocoding, text preprocessing). The `cost_benefit` field contains free-text descriptions of project costs that sometimes mention concrete monetary figures (e.g. "€20 per meter", "€14,000 for fencing"). Extracting a numeric cost estimation would enable future filtering, sorting, and comparison of case studies by cost, improving the explorer's analytical capabilities.

## What Changes

- Add a new Gemini-powered extraction step in `augment_with_ai.py` that reads the `cost_benefit` text field and returns a numeric value (or `null`) representing the estimated project cost.
- Cache the result in a dedicated cache file (`cost_estimation_cache.json`) following the same pattern as existing caches.
- Include the `cost_estimation` field in the augmented JSON output.
- Add a `cost_estimation` column (`DOUBLE PRECISION`, nullable) to the `knowledge.summary` table in `02_tables.sql` (no separate migration — the schema is recreated from scratch).
- Update `push-climate-adapt.ts` to persist the `cost_estimation` value when upserting summary rows.

## Capabilities

### New Capabilities
- `cost-estimation-extraction`: AI-powered extraction of a numeric cost value from the `cost_benefit` free-text field, with caching and database persistence.

### Modified Capabilities

_(none — no existing spec-level requirements change)_

## Impact

- **Pipeline**: `pipeline/augment_with_ai.py` — new function + integration in `augment_record`.
- **Database schema**: `packages/db/sql/02_tables.sql` — new column in `knowledge.summary`.
- **Data ingestion**: `packages/db/src/push-climate-adapt.ts` — pass `cost_estimation` through to the upsert.
- **Dependencies**: No new dependencies; uses the existing `google-genai` SDK and caching infrastructure.
