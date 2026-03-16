# Cost estimation extraction

Pipeline extraction of a numeric cost (EUR) from `cost_benefit` text via Gemini, with caching and persistence to `knowledge.summary.cost_estimation`.

---

## ADDED Requirements

### Requirement: Extract numeric cost estimation from cost_benefit text
The pipeline SHALL provide a function `extract_cost_estimation(cost_benefit_text)` that sends the `cost_benefit` field to Gemini and returns a numeric value (float) or `null`. The prompt SHALL instruct Gemini to identify the total or most representative project cost in EUR from the text. If no clear numeric cost is present, the function SHALL return `null`.

#### Scenario: Text contains a clear total cost
- **WHEN** `cost_benefit` text contains "The Kerry County Council has provided a total of €14,000 for fencing over the last nine years"
- **THEN** the function returns a numeric value (e.g. `14000`)

#### Scenario: Text contains only qualitative descriptions
- **WHEN** `cost_benefit` text contains only narrative like "The solutions are cost-effective due to the extensive involvement of local volunteers"
- **THEN** the function returns `null`

#### Scenario: Text is empty or missing
- **WHEN** `cost_benefit` is `null`, empty string, or not present
- **THEN** the function returns `null` without calling the Gemini API

### Requirement: Cache cost estimation results
The pipeline SHALL cache the result of each cost estimation extraction in `pipeline/caches/cost_estimation_cache.json`. The cache key SHALL include a version prefix (e.g. `v1:`) and the input text. Subsequent calls with the same input text SHALL return the cached result without calling the Gemini API.

#### Scenario: Cache hit
- **WHEN** the same `cost_benefit` text is processed a second time
- **THEN** the cached value is returned and no Gemini API call is made

#### Scenario: Cache miss
- **WHEN** a new `cost_benefit` text is processed for the first time
- **THEN** Gemini is called, and the result is persisted to the cache file before returning

### Requirement: Include cost_estimation in augmented output
The `augment_record` function SHALL call the cost estimation extraction and include the result as `cost_estimation` (number or `null`) in the augmented JSON output.

#### Scenario: Augmented JSON includes cost_estimation
- **WHEN** a case study with a `cost_benefit` field is augmented
- **THEN** the output JSON contains a `cost_estimation` key with a numeric value or `null`

### Requirement: Persist cost_estimation in database
The `knowledge.summary` table SHALL include a `cost_estimation` column of type `DOUBLE PRECISION` (nullable). The `push-climate-adapt.ts` upsert logic SHALL read the `cost_estimation` field from the augmented JSON and persist it to this column.

#### Scenario: Augmented JSON has numeric cost_estimation
- **WHEN** an augmented record contains `"cost_estimation": 14000`
- **THEN** the `knowledge.summary` row for that document has `cost_estimation = 14000`

#### Scenario: Augmented JSON has null cost_estimation
- **WHEN** an augmented record contains `"cost_estimation": null`
- **THEN** the `knowledge.summary` row for that document has `cost_estimation IS NULL`
