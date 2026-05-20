# Tasks — multilang knowledge push & embeddings

## 1. Translation discovery and loading (`push-climate-adapt.ts`)

- [x] 1.1 Replace the fixed `_en_augmented_es.json` glob with discovery of all `*_en_augmented_<code>.json` files per `design.md` D1; collect translation paths separately from base EN files.
- [x] 1.2 Parse optional language code from basename; warn when filename code disagrees with JSON `lang`; use JSON `lang` for upserts.
- [x] 1.3 Keep pass 1 (EN augmented files) unchanged for document creation and `source_file → document_id` map.
- [x] 1.4 In pass 2, iterate all discovered translation files (sorted); resolve `document_id`; upsert `summary_multilang`, `fulltext`, and conditional `recipe` as today for ES—parameterized by resolved `lang`.

## 2. Composed embeddings during push

- [x] 2.1 After each translation upsert for a `document_id` / `lang`, load title/summary from upserted multilang semantics (or from parsed translation JSON) and fulltext from translation JSON; call `composeEmbeddingText`, then `computeEmbedding`, then `upsertEmbedding` with `lang` equal to translation `lang`, `content_type` `composed`.
- [x] 2.2 Preserve existing English embedding behaviour from pass 1 (unchanged model/dims/cache via `embed.ts`).
- [x] 2.3 Handle empty composed text per spec (skip or no-op without failing push).

## 3. Regeneration script (`generate-embeddings.ts`)

- [x] 3.1 Replace single-lang query joining only `lang = 'en'` with a loop over distinct `lang` values present in `summary_multilang` (or configurable `--langs` comma list via argv/env), joining `summary_multilang` + `fulltext` for each lang.
- [x] 3.2 Upsert `composed` embeddings for each `(document_id, lang)` with same logic as push.
- [x] 3.3 Document script usage in `packages/db/README.md` (operator note: optional langs filter).

## 4. Documentation and ops

- [x] 4.1 Update repo root or `packages/db/README.md`: describe multi-language `pnpm db:push` behaviour and embedding cost scaling (`documents × languages`).
- [x] 4.2 Note dependency on pipeline output: Italian (or any new lang) requires `translate_augmented.py --lang <code>` artifacts present before push picks them up.

## 5. Optional SQL — FTS for Italian (keyword hybrid quality)

- [x] 5.1 (Optional) Add `WHEN 'it' THEN ts_config := 'italian'` (and reserved pattern for future langs) in `packages/db/sql/04_search_functions.sql` for `keyword_search` and `hybrid_search`; apply via migration / `db:create` workflow used in this repo.

## 6. Verification

- [ ] 6.1 Run push against a subset with `es`, `it`, and `en`; verify `knowledge.embeddings` has rows for (`composed`, `it`) where Italian fulltext exists. _(Requires `DATABASE_URL`, `GEMINI_API_KEY`, and `*_en_augmented_it.json` present — run `pnpm db:push` from `packages/db`.)_
- [ ] 6.2 Smoke-test `POST /api/search` with `lang: it` and non-empty `query` in hybrid mode on staging (semantic branch populated). _(Requires deployed app + DB with Italian rows.)_
