## Why

The knowledge loader only ingests Spanish translation files by filename convention, and the push path generates **composed** vector embeddings only for **English**. Italian and any future pipeline languages cannot be fully stored or searched: `hybrid_search` already filters by `filter_lang`, but the database lacks `summary_multilang` / `fulltext` / `recipe` rows and **`knowledge.embeddings`** rows for those languages—so the semantic arm of hybrid search is effectively empty outside English. We need a language-agnostic ingestion and embedding strategy so adding a new pipeline language does not require another hard-coded loader branch.

## What Changes

- **Generalize translation JSON discovery** in `packages/db` push: discover every `*_en_augmented_<lang>.json` (excluding the base `*_en_augmented.json`) using the `lang` field inside each file (or a controlled allowlist), not a single fixed `_es` suffix.
- **Upsert per-language content** for each discovered translation: `summary_multilang`, `fulltext`, and translated `recipe` when present—same behaviour as today for Spanish, extended to all ingested languages (e.g. Italian once pipeline files exist).
- **Generate and upsert composed embeddings** for each `(document_id, lang)` pair where translated title/summary/fulltext exist: same `composeEmbeddingText` + model/dimension/task as English (`composed`, `RETRIEVAL_DOCUMENT`), keyed by `lang` in `knowledge.embeddings`.
- **Extend offline embedding regeneration** (`generate-embeddings` or equivalent) to refresh embeddings for **all** languages present in the DB (or a configurable list), not only `en`.
- **Optional follow-on** (document in design): Postgres FTS `ts_config` mapping for additional ISO 639-1 codes (e.g. `italian`) for better keyword hybrid quality—no change to hybrid RPC shape.

No **BREAKING** API contract change to `POST /api/search`: it already passes `lang`; behaviour improves once data and embeddings exist per language.

## Capabilities

### New Capabilities

- `knowledge-multilang-push`: Discover and load all pipeline translation JSON files into `knowledge.summary_multilang`, `knowledge.fulltext`, and `knowledge.recipe` per `lang`, scalable to arbitrary future languages without code changes beyond optional configuration.
- `knowledge-embeddings-multilang`: After translated text exists for a language, compute and upsert **`composed`** embeddings per `(document_id, lang)` using the same embedding model and dimensions as English; support backfill via push and via DB-only regeneration script.

### Modified Capabilities

- (none in `openspec/specs/` at requirement level—the search route contract already supports `lang`. Operational guarantees are expressed in the new capabilities above.)

## Impact

- **packages/db**: `push-climate-adapt.ts` (translation pass generalization, embedding upserts per translation), `generate-embeddings.ts` (multi-lang), possibly `embed.ts` (reuse only).
- **pipeline**: No change required to `translate_augmented.py` output shape; Italian (and others) already emit `lang` and optional `recipe`. Operators complete translation runs before relying on push for that language.
- **apps/web**: No mandatory change; search already uses `lang` with `hybrid_search`.
- **Ops**: Full Italian push + embedding pass after pipeline finishes; additional API cost/time scales with **documents × languages** for embeddings.
