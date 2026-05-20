## Context

The Climate-Adapt pipeline produces English augmented JSON (`*_en_augmented.json`) and optional translation files (`*_en_augmented_<lang>.json`) with `lang`, `title`, `subtitle`, `summary`, `fulltext`, and optionally `recipe`. The DB schema (`knowledge.summary_multilang`, `knowledge.fulltext`, `knowledge.recipe`, `knowledge.embeddings`) already keys rows by `(document_id, lang)`. Today, **`push-climate-adapt.ts`** only globs `*_en_augmented_es.json` for pass 2 and only computes **`composed`** embeddings for **`en`** in pass 1. Italian translation files (`*_en_augmented_it.json`) are being generated asynchronously and must be ingested the same way as Spanish without special-case code per language.

Search (`POST /api/search`) already passes `lang` into `hybrid_search`, which joins embeddings and fulltext on `filter_lang`. Missing rows—not RPC shape—explain weak semantic search outside English.

## Goals / Non-Goals

**Goals:**

- Discover **all** translation JSON files next to English augmented files using a **stable, language-agnostic** rule (filename pattern + validation via embedded `lang`).
- Upsert translated **summary_multilang**, **fulltext**, and **recipe** for each translation file, identical semantics to current Spanish handling.
- After text exists for a language, upsert **`composed`** embeddings per `(document_id, lang)` using the **same** Gemini model, dimensions, and `RETRIEVAL_DOCUMENT` task as English, via existing `composeEmbeddingText(title, summary, fulltext)`.
- Extend **`generate-embeddings`** (or equivalent) to regenerate **`composed`** vectors for **every language present** in the DB (or a configurable allowlist / denylist for operators).
- Prefer **configuration over branching**: optional env var or small constant listing supported langs for embedding if we need to cap cost on staging.

**Non-Goals:**

- Changing `hybrid_search` / `match_documents` SQL signatures or the web search API contract.
- Embedding **recipe** bodies inside `composed` text unless product explicitly expands composition (current EN behaviour stays).
- Automatic translation inside TypeScript; translation remains the Python pipeline.

## Decisions

### D1: Translation file discovery

**Choice:** Glob all `pipeline/augmented/*_en_augmented_<code>.json` files (e.g. `page_0_en_augmented_it.json`). Derive `<code>` with a regex on the basename (e.g. `_en_augmented_([a-z]{2})\\.json$`). Reject files that do not match the expected pattern so accidental files are ignored.

**Algorithm:**

1. List matching translation files (exclude base `*_en_augmented.json` which has no language suffix).
2. For each file, parse and validate the language code from the filename; skip non-matching names.
3. Read JSON; require `source_file` and `lang`; use **JSON `lang`** as the source of truth for DB rows; **warn** if filename code and `lang` disagree.

**Rationale:** Adding Italian (`it`), Portuguese (`pt`), etc. requires **no new regex line** in TypeScript.

**Alternative considered:** Explicit `--langs es,it` CLI flag on push—rejected as default primary workflow because it duplicates filesystem truth and risks drift.

### D2: Ordering of passes

**Choice:** Keep pass 1 (all EN files) to populate `source_file → document_id` map; pass 2 processes **all** translation files in sorted order; for each file resolve `document_id` via `source_file`; upsert multilang + fulltext + recipe; then **compose embedding** from translated fields and upsert embedding.

**Rationale:** Embeddings must not run before summary/fulltext exist for that lang.

### D3: Embedding identity

**Choice:** Same `content_type` string **`composed`**, same model/env (`GEMINI_EMBEDDING_MODEL`, `GEMINI_EMBEDDING_DIMENSIONS`), same cache file mechanism (`embeddings_cache.json` keyed by hash of text)—Italian document text hashes differ from English naturally.

**Rationale:** Matches `search.ts` query side (`RETRIEVAL_QUERY`) vs document (`RETRIEVAL_DOCUMENT`) pairing already used for English.

### D4: Multiple translation files per base document

**Choice:** One file per `(baseStem, lang)` e.g. only `page_0_en_augmented_it.json` for Italian; if duplicates, last-write-wins with warning—should not occur.

### D5: FTS (`ts_config`) for new languages

**Choice:** Document optional SQL migration adding `WHEN 'it' THEN ... 'italian'` (and future langs) in `keyword_search` / `hybrid_search` **separate small follow-up** if not bundled—mentioned in tasks as optional for Italian keyword quality.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Push runtime and Gemini embedding cost grow as **documents × languages** | Cache embeddings by text hash; document operator tuning (stage only `en`+`es` via optional env allowlist if implemented). |
| Filename `lang` mismatch vs JSON `lang` | Log warning; prefer JSON `lang` for DB writes (source of truth). |
| Italian pipeline incomplete mid-deploy | Push ingests whatever `*_en_augmented_it.json` exist; re-run push after translation completes (idempotent upserts). |
| Regenerate-embeddings full scan heavy | Batch by language; progress logging; optional `--langs` filter in CLI. |

## Migration Plan

1. Deploy code changes to `packages/db` push + generate-embeddings.
2. Ensure `DATABASE_URL` and `GEMINI_API_KEY` set.
3. Run `pnpm db:push` after pipeline outputs exist for target languages (Italian may be partial until translation job finishes).
4. Optionally run `pnpm db:embed` or extended embed script to backfill languages—push may already embed during translation pass.
5. Validate hybrid search with `lang: it` on staging.

**Rollback:** Revert deployment; DB rows remain (forward-compatible). No destructive DDL.

## Open Questions

- Whether to add **embeddings allowlist** env (`KNOWLEDGE_EMBED_LANGS=en,es,it`) for production cost control—decide during implementation.
- Whether to bundle **Italian FTS** in the same change or a tiny follow-up SQL migration.
