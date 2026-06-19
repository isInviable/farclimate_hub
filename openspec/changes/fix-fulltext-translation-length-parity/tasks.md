## 1. Translation request fix (Python)

- [x] 1.1 In `pipeline/translate_augmented.py` `_translate_text`, set a minimal reasoning budget on the Gemini call (`thinking_config=ThinkingConfig(thinking_budget=0)`) and raise `max_output_tokens` to a value sufficient for a full chunk (e.g. 8192), keeping `temperature=0`.
- [x] 1.2 Remove the fixed 20,000-char input truncation for `fulltext` (keep a sane guard only as a chunk-size budget, not a content drop).
- [x] 1.3 Verify `title`/`subtitle`/`summary` still translate correctly with the new request settings (they inherit the thinking-budget fix; no chunking).

## 2. Section-aware chunking for fulltext (Python)

- [x] 2.1 Add a markdown-aware chunker that splits `fulltext` on heading / blank-line boundaries into chunks under a configurable char budget (~4,000), never splitting inside a fenced code block.
- [x] 2.2 Translate each chunk and reassemble preserving original separators, heading hierarchy, lists, and links/URLs.
- [x] 2.3 Route only `fulltext` through the chunker when above the threshold; translate short fulltext in a single call.

## 3. Cache fidelity + versioning (Python)

- [x] 3.1 Bump the field-translation cache key version `v2` → `v3` so prior truncated outputs are invalidated.
- [x] 3.2 Cache `fulltext` at chunk granularity (`v3:{lang}:fulltext:{chunkHash}`) so unchanged sections reuse cache; never persist empty/failed results as final.

## 4. Length-parity validation + reporting (Python)

- [x] 4.1 After reassembly, compute translated/source length ratio per document and target language; warn when below a configurable floor (default 0.5).
- [x] 4.2 Surface per-doc/lang ratios and below-floor flags in `apps/web/scripts/multilang-search-report.mjs` / `docs/multilang-free-text-search-report.md` (or an equivalent run summary).

## 5. Regenerate translations + re-ingest (no DDL)

- [x] 5.1 Run `python pipeline/translate_augmented.py --lang es` and `--lang it`; confirm output JSON keeps the existing structure (`source_file`, `lang`, `title`, `subtitle`, `summary`, `fulltext`, `recipe`) with complete `fulltext`. *(ES: 140 docs avg ratio 1.13; IT: 145 docs avg ratio 1.12; 0 below floor both)*
- [x] 5.2 Run `cd packages/db && pnpm db:push` to persist updated `fulltext` / `summary_multilang`.
- [x] 5.3 Run `pnpm db:embed -- --langs=es,it` to regenerate ES/IT embeddings from complete fulltext.

## 6. Verification

- [x] 6.1 SQL sanity: `length(fulltext)` per lang per document; confirm ES/EN and IT/EN ratios are within the healthy band (no docs near ~0.01).
- [x] 6.2 Re-run the multilang matrix test + report (`pnpm --filter web test:multilang-search`, `report:multilang-search`) and compare per-intent totals + `document_uid` overlap against the pre-fix baseline.
- [x] 6.3 Spot-check 2–3 translated docs for preserved markdown structure (headings, lists, links) and natural ES/IT prose.

## 7. OpenSpec (after implementation)

- [ ] 7.1 When implementation is complete and verified, run the apply workflow through tasks, then archive the change per project OpenSpec archive rules.
