## Context

- **Knowledge schema** already has `knowledge.documents` (identity), `knowledge.summary` (facets), multilingual summary/fulltext, and embeddings (`packages/db/sql/02_tables.sql`).
- **Augmentation** is centralized in `pipeline/augment_with_ai.py` (`augment_record`), which produces `pipeline/augmented/*_en_augmented.json`. Ingestion is `packages/db/src/push-climate-adapt.ts`, which upserts document, summary, multilang, fulltext, and embeddings for `en`, then applies ES translations for a second language.
- **Product term**: “Recipe” = standardized sections; we persist the section bundle as JSONB (`ingredients`) plus `lang` for future multilingual rows.

## Goals / Non-Goals

**Goals:**

- Extract recipe content from the **raw case-study text available to the pipeline** (same provenance as other augmentations), using the **exact behavioral rules** in the user-provided prompt (no inference; empty strings for absent sections; no markdown wrapper in model output).
- Store **one row per (document, language)** with FK to `knowledge.documents`.
- Normalize LLM key names into a **stable JSON shape** for the app and DB.

**Non-Goals:**

- **UI** for the Recipe view, new RPCs, or PostgREST shape changes (read-only table access may be enough initially).
- **Spanish (or other) recipe generation** in v1 — only `lang = 'en'` from the English augmentation pass unless explicitly extended later.
- **Duplicating title or short narrative in `ingredients`** — those live in `knowledge.summary_multilang` (and related fields) and are out of scope for `knowledge.recipe.ingredients`.

## Decisions

### 1. Table placement and shape

- **Decision**: Create `knowledge.recipe` with columns `id UUID PK`, `document_id UUID NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE`, `lang TEXT NOT NULL`, `ingredients JSONB NOT NULL`, `UNIQUE (document_id, lang)`.
- **Rationale**: Matches embeddings/multilang pattern; JSONB avoids a wide table and matches “ingredients” as evolving sections.
- **Alternatives**: One TEXT column per section — rejected (many columns, harder to evolve); store inside `summary` — rejected (1:1 summary is facet-oriented, recipe is a separate derived artifact).

### 2. Canonical `ingredients` keys

- **Decision**: After parsing the model JSON, map to these keys only (all string values). Do **not** persist `title`, `short_description`, or `sdgs` in `ingredients` (titles and short user-facing narrative are already in `knowledge.summary_multilang`; SDGs are not used).

  | Stored key | Source in model prompt output |
  |------------|-------------------------------|
  | `who_is_involved` | `who_is_involved` |
  | `economic_data` | `economic_data` |
  | `context_summary` | `context_summary` |
  | `challenges` | `context_challenges` |
  | `policy_context` | `context_policy` |
  | `legal_aspects` | `context_legal_aspects` |
  | `objectives` | `objectives` |
  | `solutions_implemented` | `solutions_implemented` |
  | `implementation_phases` | `implementation_phases` |
  | `success_and_limiting` | `success_and_limiting_factors` |
  | `benefits` | `benefits` |
  | `lessons_learnt` | `lessons_learnt` |
  | `transferability` | `transferability` |

- **Rationale**: Aligns stored JSON with recipe-only sections; avoids duplication with `summary_multilang`.
- **Prompt**: The recipe LLM prompt SHALL be edited to **omit** `title` and `short_description` (and any SDG field) so the model never spends tokens on redundant sections. If legacy responses still include those keys, the normalizer SHALL drop them before cache write and DB write.
- **Alternatives**: Store raw model keys in JSONB — rejected (splits naming between API and product).

### 3. Source text for extraction

- **Decision**: Use the **same primary narrative body** the pipeline already uses for other LLM steps (e.g. composed fulltext or the main case-study text field in the extracted JSON — implementers SHALL choose the single field that best matches “raw text of the case study” and document it in code). If that field is missing or empty, skip the API call and persist empty `ingredients` (all required keys as `""`) or omit recipe upsert per spec.

- **Rationale**: One consistent input avoids divergence between “what humans read” and “what the model sees.”

### 4. Caching and idempotency

- **Decision**: Follow the **same guidelines as other augmentation steps** in `augment_with_ai.py`: a JSON file under `pipeline/caches/` (e.g. `recipe_extraction_cache.json`), **version-prefixed cache keys** so prompt or `ingredients` shape changes invalidate old entries, and **reuse on identical input** so re-runs and additional datasets do not repeat LLM calls for the same source text. Mirror the structure and usage of `cost_estimation_cache.json` / existing cache helpers in that script.

### 5. Augmented JSON shape

- **Decision**: Add a top-level key `recipe: { lang: "en", ingredients: { ... } }` on English augmented output (no nested `id`/`document_id` in JSON — those are DB-only).

## Risks / Trade-offs

- **[Risk] Model returns invalid JSON or extra keys** → Mitigation: strict parse/repair or retry once; on failure log and write empty normalized `ingredients` or skip upsert (behavior locked in spec).
- **[Risk] Token limits on very long case studies** → Mitigation: truncate with explicit logging or chunking policy in implementation tasks if needed.

## Migration Plan

- **Greenfield / recreated DB**: Update consolidated `02_tables.sql`; run `db:create` as today.
- **Existing Supabase**: Add a forward migration or manual SQL applying the same `CREATE TABLE` + index + comments if the team does not rebuild from consolidated files (follow internal DB release process).
