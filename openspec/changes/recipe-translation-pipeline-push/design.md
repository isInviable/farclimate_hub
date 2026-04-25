## Context

English augmentation (`augment_with_ai.py`) writes `recipe: { lang: "en", ingredients }` into `*_en_augmented.json`. Recipe extraction uses Gemini and `pipeline/caches/recipe_extraction_cache.json`. `translate_augmented.py` calls Gemini for `title`, `subtitle`, `summary`, `fulltext` only, caches in `translation_cache.json`, and writes slim `*_en_augmented_<lang>.json` files. `push-climate-adapt.ts` upserts `knowledge.recipe` from English files only; pass 2 updates `summary_multilang` and `fulltext` for translations, not recipe.

`knowledge.recipe` already has `lang TEXT NOT NULL` and `UNIQUE (document_id, lang)`.

## Goals / Non-Goals

**Goals:**

- Translate each non-empty string value in `recipe.ingredients` to the pipeline `--lang` target while preserving canonical keys and markdown where present.
- Persist translation results in a **separate versioned JSON cache** on disk (same machine as the pipeline — “local” cache), keyed so repeated runs avoid redundant LLM calls.
- Emit `recipe` on translation JSON artifacts so they are self-contained for push.
- Upsert translated recipe rows in pass 2 of `push-climate-adapt` when ingredients have content.

**Non-Goals:**

- Changing the `knowledge.recipe` table, RPCs, or explorer SQL.
- Translating recipe by re-extracting from translated `fulltext` (that would duplicate extraction logic and invalidate extraction cache); this design **translates the English ingredients object** instead.
- Batch / streaming optimization beyond what existing translate script already does.
- New languages beyond what `--lang` already supports (reuse same mechanism).

## Decisions

1. **Where translation runs**  
   **Choice:** Extend `translate_augmented.py` (same entrypoint, env vars, Gemini client pattern as `_translate_text`) so operators keep one command for “all UI strings + recipe” per document.  
   **Alternative:** Separate `translate_recipe.py` — rejected to avoid duplicate CLI/env wiring and two passes over the same files.

2. **Cache file**  
   **Choice:** New file e.g. `pipeline/caches/recipe_translation_cache.json` with keys including a **version prefix** (e.g. `v1`), target `lang`, and a stable fingerprint of the **English ingredients JSON** (sorted keys + values or hash of normalized JSON string) so cache invalidation is explicit when prompts change.  
   **Alternative:** Reuse `translation_cache.json` — rejected to keep concerns separate and avoid huge keys mixing fulltext with structured blobs.

3. **One LLM call vs per-section**  
   **Choice:** Prefer **one structured call per document** translating the whole `ingredients` object (with a JSON-shaped prompt or schema response), to reduce latency and cost versus twelve separate calls. Fall back to per-key translation only if implementation constraints require it.  
   **Alternative:** Loop `_translate_text` per canonical key — acceptable but more API round-trips; document if chosen during implementation.

4. **Empty / missing recipe**  
   **Choice:** If English augmented JSON has no renderable recipe, omit `recipe` from the translation file or write `{ "lang": "<target>", "ingredients": <all empty strings> }` consistent with normalization; push pass 2 SHALL **skip** recipe upsert when there is no renderable translated content (same guard as English).

5. **Push ordering**  
   **Choice:** Keep pass 1 (EN) unchanged. In pass 2, after `summary_multilang` / `fulltext`, call the same `upsertRecipe(documentId, recipeLang, ingredients)` used in pass 1 when `trans.recipe` qualifies.

## Risks / Trade-offs

- **[Risk] Large ingredients JSON exceeds model output limits** → Mitigation: truncate per-section with a documented cap consistent with extraction, or split by key groups if needed.
- **[Risk] Translated JSON malformed** → Mitigation: validate against canonical keys post-call; on failure log and skip recipe upsert for that document without failing entire push.
- **[Trade-off] Translating ingredients vs fulltext** may diverge slightly from a hypothetical “re-extract from ES fulltext” — acceptable for consistency with English recipe sections.

## Migration Plan

1. Ship code + cache file path; no DB migration.
2. Re-run `translate_augmented.py --lang es` (and others as needed) to regenerate translation JSON files with `recipe`.
3. Re-run `push-climate-adapt` to upsert `knowledge.recipe` rows for `es`.
4. Rollback: remove `recipe` from translation JSON and re-push; optional manual `DELETE` of non-`en` recipe rows if operators need a clean slate (not automated).

## Open Questions

- Whether to bump `max_output_tokens` for recipe-only generation compared to short fields (implementation detail; resolve when coding).
- Exact prompt wording for “preserve markdown bullets” to mirror `fulltext` translation rules.
