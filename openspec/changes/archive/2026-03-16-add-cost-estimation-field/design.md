## Context

The augmentation pipeline (`pipeline/augment_with_ai.py`) already follows a well-established pattern for AI-powered field extraction: a dedicated function calls Gemini, parses the response, caches the result in a JSON file under `pipeline/caches/`, and the `augment_record` orchestrator integrates it into the output. The database schema (`packages/db/sql/02_tables.sql`) is recreated from scratch each deployment, so adding a column is a simple inline edit — no migration needed.

The `cost_benefit` field is a free-text narrative that sometimes contains concrete monetary figures (e.g. "€20 per meter", "€14,000 for fencing") and sometimes only qualitative descriptions with no numbers at all.

## Goals / Non-Goals

**Goals:**
- Extract a single representative numeric cost (in EUR) from `cost_benefit` text when one is present.
- Return `null` when no clear numeric cost can be identified.
- Cache results to avoid redundant API calls, consistent with existing caching pattern.
- Persist the value in `knowledge.summary.cost_estimation`.

**Non-Goals:**
- Currency conversion — assume all values are in EUR (the source data is EU-centric).
- Extracting multiple cost figures or a cost breakdown — a single representative value is sufficient.
- Exposing the field in the search API or explorer UI — that is a separate future change.

## Decisions

### 1. Prompt strategy: ask Gemini for a single number or null

The prompt instructs Gemini to read the `cost_benefit` text and return either a JSON `{"cost_estimation": <number>}` or `{"cost_estimation": null}`. This mirrors the existing `extract_years_from_fulltext` approach (structured JSON output, small token budget).

**Alternatives considered:**
- Regex extraction: fragile — amounts appear in varied formats ("€20 per meter", "14,000", "€20/m").
- Multiple-value extraction: adds complexity without clear use-case; a single value per case study is enough for filtering/sorting.

### 2. Cache file: `cost_estimation_cache.json`

A dedicated cache file keyed by the (possibly truncated) `cost_benefit` text, following the same `_load_json_cache` / `_save_json_cache` pattern. Versioned cache key (`v1:`) to allow prompt evolution.

### 3. Column type: `DOUBLE PRECISION` nullable

Numeric precision is sufficient (we're storing round EUR values, not exact decimals). `NULL` represents "no cost info available". No default value.

### 4. No new migration file

Since the schema is dropped and recreated from `02_tables.sql`, the column is added inline. The `push-climate-adapt.ts` upsert is updated to include the new field.

## Risks / Trade-offs

- **[Gemini may hallucinate a number]** → The prompt explicitly instructs to return `null` when no clear numeric cost is present. Cached results can be manually reviewed.
- **[Some case studies have multiple cost figures]** → The prompt asks for the "total or most representative project cost", accepting that this is a best-effort approximation.
- **[Cache invalidation on prompt changes]** → Versioned cache keys (`v1:`) allow clearing stale entries by bumping the version.
