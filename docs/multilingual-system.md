# Multilingual knowledge and web app

This document describes how **Climate-ADAPT case study content** is produced in multiple languages, loaded into PostgreSQL, searched, and shown in the Nuxt explorer. It is aimed at developers adding a **new language** end to end.

---

## Architecture overview

| Layer | Role |
|--------|------|
| **Pipeline (`pipeline/`)** | English augmented JSON → translated sibling files per ISO language code. |
| **Database (`packages/db`)** | Stores one logical document (`knowledge.documents`) with **per-language** rows in `summary_multilang`, `fulltext`, `recipe`, and **composed embeddings** in `knowledge.embeddings` keyed by `(document_id, lang)`. |
| **Supabase RPCs** | Search and document fetch use `filter_lang` (e.g. `en`, `es`, `it`) to choose text and embeddings. |
| **Web (`apps/web`)** | Nuxt i18n drives UI strings; **API calls** pass the same ISO code the database expects via `knowledgeApiLang()`. |

English remains the **authoritative extraction language**. Other languages are **derived** from augmented English JSON.

---

## Part 1 — Pipeline

### Artifacts

- **English (required):** `pipeline/augmented/<stem>_en_augmented.json`  
  Produced earlier in the pipeline (e.g. augmentation). Contains `source_file`, `title`, `subtitle`, `summary`, `fulltext`, optional `recipe`, etc.

- **Translations:** `pipeline/augmented/<stem>_en_augmented_<code>.json`  
  `<code>` is a **two-letter ISO 639-1** tag (e.g. `es`, `it`). The stem matches the English file (`page_42_en_augmented.json` → `page_42_en_augmented_it.json`).

### Translation script

**Script:** `pipeline/translate_augmented.py`

**Typical invocation:**

```bash
python pipeline/translate_augmented.py --lang <code> [--pattern '*_en_augmented.json'] [--input pipeline/augmented]
```

**Environment:** `GEMINI_API_KEY` (and optionally `GEMINI_MODEL_TRANSLATE`). Env is read from repo `.env` and/or `pipeline/.env`.

**What gets translated (when present in English):**

- `title`, `subtitle`, `summary`, `fulltext`
- `recipe.ingredients` (canonical section keys aligned with `knowledge.recipe`)

**Caches:** `pipeline/caches/translation_cache.json` and `recipe_translation_cache.json` reduce repeat API calls. Cache invalidation is tied to cache **version** constants in the script when prompts or hashing change.

### Adding a new pipeline language

1. **Choose an ISO 639-1 code** (two letters), e.g. `de`.

2. **Optional but recommended — explicit language label for the LLM**  
   In `translate_augmented.py`, extend `TARGET_LANGUAGE_LABELS` with that code → English name (e.g. `"de": "German"`).  
   This avoids ambiguous prompts (Gemini misreading `"it"` as the English pronoun “it”, etc.).

3. **Run translation** for the full corpus (or a `--pattern` subset):

   ```bash
   python pipeline/translate_augmented.py --lang de
   ```

4. **Verify output:** for each English augmented file you care about, a sibling `*_en_augmented_de.json` should exist with `"lang": "de"` and non-empty user-visible fields where the English source had content.

5. **No change is required** to the TypeScript loader for discovery: `packages/db/src/push-climate-adapt.ts` picks up **any** `*_en_augmented_<two-letter>.json` file.

---

## Part 2 — Database and load scripts

### Tables involved (conceptual)

- `knowledge.documents` — stable identity (`document_uid`, URLs, English-centric metadata column `title` used as fallback in RPCs).
- `knowledge.summary_multilang` — `(document_id, lang)` → `title`, `subtitle`, `summary`.
- `knowledge.fulltext` — `(document_id, lang)` → markdown/HTML body.
- `knowledge.recipe` — `(document_id, lang)` → structured ingredients JSON.
- `knowledge.embeddings` — `(document_id, lang, content_type)`; **`composed`** uses text built from title + summary + truncated fulltext.

### Load order (`pnpm db:push`)

**Script:** `packages/db/src/push-climate-adapt.ts`

1. **Pass 1 — English:** every `*_en_augmented.json` that is **not** a translation filename (pattern `*_en_augmented_<xx>.json` excluded). Upserts the document, English summary rows, fulltext, recipe, images, and **`composed` embedding for `lang = 'en'`**.

2. **Pass 2 — All translations:** every `*_en_augmented_<code>.json`. Looks up `document_id` by **`source_file`** from the English pass. Upserts `summary_multilang`, `fulltext`, optional `recipe`, and **`composed` embedding** for that `lang`.

**Prerequisite:** English for that `source_file` must be pushed first so `source_file → document_id` exists.

**Configuration:** `DATABASE_URL`, `GEMINI_API_KEY` (embeddings). See `packages/db/README.md`.

### Regenerating embeddings only (`pnpm db:embed`)

**Script:** `packages/db/src/generate-embeddings.ts`

Reads **existing** DB rows (not JSON). Use after changing embedding model/dimensions or to backfill. Optional: `--langs=en,de`.

**Important:** Run **`pnpm db:push`** after fixing or regenerating translation JSON so the DB text matches files **before** relying on `db:embed` for vectors. Push already computes embeddings from JSON during load.

### Full-text search language (`filter_lang`)

Keyword / hybrid search map `filter_lang` to a Postgres **text search configuration** (e.g. `english`, `spanish`, `italian`).  

**File:** `packages/db/sql/04_search_functions.sql`

When adding a language that should use a **non-simple** stemmer/dictionary, add a branch such as:

```sql
WHEN 'de' THEN ts_config := 'german';
```

Use only configs available on your Postgres (Supabase ships many `*_stem` / named configs — confirm with `SELECT cfgname FROM pg_ts_config`).

After editing SQL, apply to the target DB: **`pnpm db:create`** in `packages/db`, or run the updated function definitions against Supabase.

---

## Part 3 — Web application (Nuxt)

### UI translations (chrome, labels, messages)

**Config:** `apps/web/nuxt.config.ts` → `i18n.locales`

Each locale needs:

- `code` — must match what you use for **knowledge** where applicable (typically ISO 639-1: `en`, `es`, `it`).
- `file` — `apps/web/i18n/locales/<code>.json`

Add a new locale entry and copy or translate strings from `en.json` as needed.

### Mapping UI locale → knowledge API `lang`

The explorer and server RPCs expect **the same short codes** stored in `summary_multilang.lang` (`en`, `es`, `it`, …).

**Central helper:** `apps/web/app/utils/knowledgeApiLang.ts`

- **`KNOWLEDGE_API_LANGS`** — must include **every** language that exists in the database for knowledge content.
- **`knowledgeApiLang(localeCode)`** — maps `useI18n()` locale (including variants like `it-IT`) to a supported API code; unknown locales fall back to `en`.

When you add a new knowledge language:

1. Add its code to **`KNOWLEDGE_API_LANGS`**.
2. Ensure all explorer/API call sites use **`knowledgeApiLang(locale)`** (or the same list) for `lang` / `filter_lang` query and POST bodies — **do not** hardcode only Spanish vs English.

Typical consumers: hybrid search (`useHybridSearch`), `/api/document-by-uid`, `/api/document-recipe`, article pages, pin/deep-link loaders, wizards that fetch document fulltext.

### Server routes

API handlers forward `lang` to Supabase RPCs (`get_documents_by_ids`, `hybrid_search`, etc.). No change is usually needed beyond clients sending the correct `lang`.

### End-to-end checklist for a new language

| Step | Action |
|------|--------|
| 1 | Pipeline: add label in `TARGET_LANGUAGE_LABELS`, run `translate_augmented.py --lang <code>`. |
| 2 | DB: optional FTS branch in `04_search_functions.sql`; apply migrations/functions to Supabase. |
| 3 | DB: `pnpm db:push` from `packages/db` with env vars set (loads JSON + embeddings). |
| 4 | Web: add Nuxt i18n locale + `i18n/locales/<code>.json`. |
| 5 | Web: add `<code>` to **`KNOWLEDGE_API_LANGS`** in `knowledgeApiLang.ts`. |
| 6 | Smoke-test: switch UI to the new locale, run search, open an article and confirm titles/body match the new language. |

---

## Related references

- `packages/db/README.md` — scripts and env vars for push/embed.
- `packages/db/sql/06_public_api.sql` — `get_documents_by_ids` uses `filter_lang` for multilingual columns (`COALESCE(ml.title, d.title)` for title when multilang title is missing).
- OpenSpec change **multilang-knowledge-push-embeddings** (under `openspec/changes/`) — design notes for generalized translation file discovery and per-language embeddings.
