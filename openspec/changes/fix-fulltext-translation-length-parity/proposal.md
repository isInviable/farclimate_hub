## Why

Translated `fulltext` for Spanish and Italian is truncated to a tiny fragment of the English source (e.g. EN 24,551 chars → ES 176 chars, cut mid-sentence), which collapses lexical (FTS) and semantic (embedding) recall and is the root cause of the multilingual free-text search disparity (`fishery` EN → 10 results vs `pesca` ES → 2). A probe confirmed the mechanism: `translate_augmented.py` calls `gemini-2.5-flash` with `max_output_tokens=1200` while the model's *thinking* tokens consume that budget — only ~48 output tokens survive (`finish_reason=MAX_TOKENS`). Raising the cap alone does not fix it (thinking expands to fill it); disabling thinking does (ratio 0.01 → 1.11).

## What Changes

- Translate the **full** English `fulltext` without dropping content past the current 20,000-char input cap.
- Translate long `fulltext` in **chunks split on markdown heading/section boundaries** (case studies have ~34 headings each), translating each chunk and reassembling, so no single request risks the output ceiling.
- Set a **minimal reasoning/thinking budget** on translation calls (`thinking_budget=0` on Gemini 2.5) and a sufficient `max_output_tokens` so visible output is complete.
- Add a **length-parity validation**: compute translated/source length ratio per document and language, warn/flag when below a configurable floor (e.g. 0.5), and surface it in the existing multilang report.
- **Bump the translation cache version** (`v2` → `v3`) so previously cached truncated outputs are invalidated; key long-field chunks so re-runs are cheap and partial-failure-resilient.
- Re-run translate (es/it) → push → embed → re-validate the multilang matrix.

The translation pipeline's **output JSON structure is unchanged** (`source_file`, `lang`, `title`, `subtitle`, `summary`, `fulltext`, `recipe`) — only the `fulltext` *content* becomes complete. **No database schema, RPC, or explorer SQL changes.**

## Capabilities

### New Capabilities

- `knowledge-translation`: normative requirements for the augmented-content translation step — complete (non-truncated) translation of long fields within provider limits, structure-aware chunking, controlled model reasoning budget, length-parity validation/reporting, and translation-cache fidelity/versioning. Written model-agnostically so the translation backend can change later without rewriting requirements.

### Modified Capabilities

- (none — no existing spec's requirements change; the translation-output JSON contract and `knowledge.*` schema stay as-is.)

## Impact

- `pipeline/translate_augmented.py` — `_translate_text` (thinking budget, output tokens, remove input truncation), new heading-aware chunker for `fulltext`, length-ratio validation, cache version bump.
- `pipeline/caches/translation_cache.json` — `v3` keys (old `v2` entries become stale, not deleted).
- Validation/reporting: `apps/web/scripts/multilang-search-report.mjs` + `docs/multilang-free-text-search-report.md` (re-run, compare).
- Operational re-ingestion (no DDL): `packages/db` `db:push` then `db:embed -- --langs=es,it`.
- No changes to `knowledge.fulltext` / `knowledge.summary_multilang` / `knowledge.embeddings` schema, search RPCs, or the translation-output JSON shape.
