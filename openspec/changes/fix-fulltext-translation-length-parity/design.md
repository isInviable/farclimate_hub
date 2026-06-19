## Context

`pipeline/translate_augmented.py` produces translation-only JSON (`*_en_augmented_<lang>.json`) for `title`, `subtitle`, `summary`, `fulltext` (+ `recipe`). The `_translate_text` helper:

- truncates source input to 20,000 chars (`src[:20000]`),
- makes a single Gemini call with `config=GenerateContentConfig(max_output_tokens=1200)`,
- caches results under key `v2:{lang}:{field}:{src}`.

`gemini-2.5-flash` has thinking enabled by default. A probe against a real 20k-char `fulltext` confirmed the failure mode and the fix:

| Config | thoughts tok | output tok | output chars | ratio | finish |
|---|---|---|---|---|---|
| `max_output_tokens=1200` (current) | 1148 | 48 | 182 | 0.01 | `MAX_TOKENS` |
| `max_output_tokens=8192` (cap only) | 7861 | 327 | 1377 | 0.07 | `MAX_TOKENS` |
| `8192` + `thinking_budget=0` | — | 4641 | 22,212 | 1.11 | `STOP` |

So thinking tokens consume the output budget; raising the cap alone is insufficient (thinking expands to fill it); `thinking_budget=0` is the decisive fix. The truncated outputs are also pinned in the `v2` cache.

Downstream, `knowledge.fulltext.fts` (FTS) and `composeEmbeddingText` (`MAX_FULLTEXT_CHARS=6000`) both depend on `fulltext`, so the fragment crushes lexical and semantic recall for ES/IT.

Constraint from product owner: the translation-output JSON structure must stay identical and no DB schema / RPC / explorer SQL changes — only the `fulltext` content becomes complete.

## Goals / Non-Goals

**Goals:**

- Produce complete, length-parity `fulltext` translations for `es` and `it` (and any `--lang`).
- Keep the existing translation-output JSON contract and file naming.
- Make re-runs cheap and partial-failure-resilient (chunk-level caching, cache version bump).
- Provide a length-parity quality gate visible in the existing multilang report.

**Non-Goals:**

- Switching the translation backend to the Google Translation LLM (deferred; larger, infra-gated, markdown-fidelity risk).
- Any change to `knowledge.*` schema, search RPCs, explorer SQL, embeddings composition, or the translation JSON field set.
- Re-architecting `title`/`subtitle`/`summary` translation (short fields); only `fulltext` gets chunking. They still benefit from the thinking-budget fix.
- Cross-lingual retrieval, synonym expansion, multilingual embedding models (separate future work).

## Decisions

1. **Disable thinking, raise output tokens (model-agnostic phrasing)**
   **Choice:** Set `thinking_budget=0` (Gemini 2.5) via `ThinkingConfig` and `max_output_tokens` high enough per chunk (e.g. 8192). The spec phrases this as "minimal reasoning budget" so a future Gemini 3 move (`thinking_level=MINIMAL`) or model swap doesn't require a spec rewrite.
   **Alternative:** Only raise `max_output_tokens` — rejected; probe shows it still truncates (ratio 0.07).

2. **Remove the 20k input truncation; chunk `fulltext` by section**
   **Choice:** Drop `src[:20000]` for `fulltext`. Split on markdown heading/blank-line boundaries into chunks under a char budget (~4,000), never inside a fenced code block; translate each chunk; rejoin with original separators. Case studies have ~34 headings, so section splitting is natural and preserves context per call.
   **Alternative A:** Single whole-document call with a very high token cap — works for most docs (probe) but risks the output ceiling on the largest (35k) docs and is non-resumable.
   **Alternative B:** Fixed-size char windows ignoring structure — rejected; splits mid-element and degrades markdown/translation quality.

3. **Cache version bump + chunk-level keys**
   **Choice:** Bump field-translation cache version `v2` → `v3`. For chunked `fulltext`, key each chunk (`v3:{lang}:fulltext:{chunkHash}`) so unchanged sections reuse cache and a failed chunk doesn't poison the whole doc. Never store empty/failed results as final.
   **Alternative:** Manually purge `translation_cache.json` — rejected; version bump is explicit, reversible, and self-documenting.

4. **Length-parity validation as a quality gate**
   **Choice:** After reassembly, compute `len(translated)/len(source)`; warn when `< 0.5` (configurable). Healthy ES/IT runs ≈0.9–1.3. Emit per-doc/lang ratios into the existing `multilang-search-report` / `docs/multilang-free-text-search-report.md` for regression visibility.
   **Alternative:** Hard-fail the run below threshold — rejected for first iteration; warn + report avoids blocking a batch on one outlier, with an option to escalate later.

5. **Same model (`gemini-2.5-flash`), same auth**
   **Choice:** Keep the existing `GEMINI_API_KEY` + `google-genai` client; no new dependency or GCP/IAM setup. Translation LLM upgrade is explicitly deferred.

## Risks / Trade-offs

- **[Risk] Chunk boundaries break markdown (e.g. a list or code block spanning a split)** → Mitigation: split only at heading / blank-line boundaries and never inside fenced code blocks; reassemble with original separators; the length-parity check and a spot markdown diff catch regressions.
- **[Risk] More API calls per document (one per chunk) increase latency/cost and quota pressure across 146 docs × 2 langs** → Mitigation: chunk-level caching makes re-runs near-free; most docs are a handful of chunks; `temperature=0` keeps output stable.
- **[Risk] Length ratio is a coarse proxy (a complete translation could legitimately differ in length)** → Mitigation: threshold is a low floor (0.5) to catch gross truncation, not enforce exact parity; healthy band documented for operators.
- **[Risk] Old `v2` cache entries linger on disk** → Mitigation: version bump ignores them; optional manual cleanup, not automated.
- **[Trade-off] Per-chunk translation may slightly reduce cross-section fluency vs one whole-doc call** → Accepted; section-level context is sufficient for case-study prose and protects against the output ceiling.

## Migration Plan

1. Ship code changes to `translate_augmented.py` (thinking budget, remove input cap, section chunker, length validation, `v3` cache) — no DB migration.
2. Re-run `python pipeline/translate_augmented.py --lang es` and `--lang it` to regenerate `*_en_augmented_{es,it}.json` with complete `fulltext`.
3. Re-ingest: `cd packages/db && pnpm db:push`, then `pnpm db:embed -- --langs=es,it` to regenerate ES/IT embeddings from the now-complete fulltext. Italian FTS trigger already correct (prior sprint); no FTS backfill needed.
4. Re-validate: run the multilang matrix test + report; compare per-intent totals and `document_uid` overlap, and confirm fulltext length ratios ES/EN and IT/EN.
5. Rollback: revert the code change and re-run translate+push to restore prior behavior; old `v2` cache remains available.

## Open Questions

- Exact chunk-size budget (≈4,000 chars) and `max_output_tokens` per chunk — tune during implementation against the largest (35k-char) documents.
- Whether `summary` should also use the parity check (short field, likely unnecessary) — default no; revisit if reports show summary truncation after the thinking-budget fix.
- Whether to later promote the parity warning to a hard failure in CI/batch once baseline ratios are established.
