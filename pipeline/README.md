# Data pipeline (structured, reproducible)

This folder holds the pipeline from Climate-ADAPT URLs to JSON ready for the database. Each step is a separate script; outputs are stored in predictable locations. For the full ordered process see the [repo root README](../README.md).

**CSV de URLs:** Step 1 reads a CSV whose first column is "About" (one URL per row). Default: `pipeline/data-5.csv`. Override with `--csv` if needed.

---

## Quick setup: end-to-end sequence

Run from the repo root. Steps 1 and 2a only need to be re-run when the URL list or the extraction schema changes; everything else is idempotent and safe to re-run.

```bash
# 0. Credentials (once) — copy .env.example to .env and fill in:
#    - OPENAI_API_KEY          (Step 2a only)
#    - GEMINI_API_KEY          (Steps 3, 4)
#    - ARCGIS_API_KEY          (optional, Step 3 geocoding)
#    - DATABASE_URL            (Step 5, direct Postgres URI)
#    - SUPABASE_URL            (Step 5, for uploading images to Storage)
#    - SUPABASE_SERVICE_ROLE_KEY  (Step 5, server-only secret)

# 1. Fetch raw HTML into pipeline/source_html/ (network, slow)
python pipeline/fetch_html.py

# 2a. (One-time) Generate the extraction schema from a representative page
python pipeline/generate_extraction_schema.py \
  --html pipeline/source_html/page_1.html \
  --output pipeline/extraction_schema_generated.json

# 2b. Extract structured JSON + window.__data gallery_images[] into pipeline/extracted/
python pipeline/extract_from_html.py

# 2c. Download every image referenced in gallery_images[] into pipeline/images/<slug>/
python pipeline/download_images.py

# 3. AI augmentation (geocoding, implementation years, cleanup) -> pipeline/augmented/
python pipeline/augment_with_ai.py

# 4. Translate augmented EN records into ES (or other target langs)
python pipeline/translate_augmented.py

# 5. Push to Supabase: schema, documents, embeddings, and article images
cd packages/db
pnpm db:create          # once (or after schema changes); idempotent — see note below
pnpm db:push            # reads pipeline/augmented/ + pipeline/images/<slug>/manifest.json
cd -
```

Partial re-runs are cheap: `extract_from_html.py`, `download_images.py`, and `db:push` are all idempotent and will only re-do work when inputs change (or when you pass `--force` to the downloader).

### Updating an existing database

If the schema already exists and you just want to merge in new or updated content, skip `db:create` entirely — `db:push` is fully upsert-based and will overwrite what needs overwriting while leaving everything else alone. A day-to-day refresh loop is just:

```bash
python pipeline/extract_from_html.py   # if gallery_images[] changed
python pipeline/download_images.py     # if new images need caching
pnpm -F @farclimate/db db:push
```

Per-row semantics of `db:push`:

- `knowledge.documents`, `knowledge.summary`, `knowledge.summary_multilang`, `knowledge.fulltext`, `knowledge.recipe` — `INSERT … ON CONFLICT DO UPDATE`; existing rows are overwritten with the new values, missing rows are created, unrelated rows are left alone.
- `knowledge.embeddings` — recomputed and replaced per document.
- `knowledge.document_images` — for each document, `DELETE` + batched `INSERT` of the current manifest. Images present locally win; images that disappeared between runs are removed from the DB.
- `article-images` Storage bucket — uploads with `upsert: true`, so object keys are overwritten in place. **Objects whose DB row was removed are not garbage-collected** — they linger in Storage (harmless, just wasted bytes). Clean them manually via the Supabase UI if you care.

### When you actually need the other `db:*` commands

| Command | Safe to re-run? | Use when |
|---|---|---|
| `pnpm db:push` | Yes (pure upsert) | Any data refresh — the default loop |
| `pnpm db:create` | Yes (`CREATE TABLE IF NOT EXISTS` + `CREATE OR REPLACE FUNCTION` throughout) | After pulling schema changes (e.g. new `document_images` table, updated `public.get_*` signatures) |
| `pnpm db:truncate` | Yes, but wipes all knowledge rows | You want a data-only reset without touching the schema |
| `pnpm db:drop` | **No — drops all knowledge tables** | Only when you want a clean schema slate |
| `pnpm db:reset` | **No — equivalent to drop + create + push** | Start-from-zero full rebuild |

### Gotchas when upgrading from the old schema

- **Legacy `documents.image_url` column.** Replaced by `knowledge.document_images`. A migration (`drop_legacy_documents_image_url_column`) removes it from any database that still has it, and `packages/db/sql/02_tables.sql` no longer declares it, so fresh `db:create` runs never recreate it. Old local DBs that haven't replayed migrations can be cleaned up manually with `ALTER TABLE knowledge.documents DROP COLUMN IF EXISTS image_url;`.
- **`article-images` bucket must exist before the first `db:push`.** Apply `packages/supabase-setup/sql/08_article_images_storage.sql` via the Supabase SQL editor once; otherwise the loader logs one warning per article and skips image uploads but still upserts documents.
- **Missing `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.** Same failure mode — documents are pushed, image sync is skipped with a per-article warning. You'll notice empty `knowledge.document_images` and empty `document.images[]` in the API response.

---

## Step 1: Fetch and save HTML (source of truth)

**Script:** `fetch_html.py`

Reads the URL list from the CSV (default `pipeline/data-5.csv`; first column "About"), fetches each page with crawl4ai, and saves the **raw HTML** into `source_html/`. No extraction or transformation—this directory is the source of truth for all later steps.

**Run from repo root:**

```bash
python pipeline/fetch_html.py
```

**Options:**

| Option     | Default                    | Description                    |
|-----------|----------------------------|--------------------------------|
| `--csv`   | `pipeline/data-5.csv`      | Path to CSV with URLs (first column "About")          |
| `--output`| `pipeline/source_html`     | Directory where HTML files go  |
| `--start` | 0                          | First URL index (0-based)      |
| `--end`   | (all)                      | Last URL index (exclusive)     |
| `--delay` | 1.0                        | Seconds between requests       |

**Example (first 5 URLs):**

```bash
python pipeline/fetch_html.py --start 0 --end 5
```

**Output:** One file per URL, e.g. `source_html/page_0.html`, `source_html/page_1.html`, …  
Also writes `source_html/url_manifest.json` (stem → URL) so Step 2 can add `source_url` to each extracted JSON.

**Requirements:** crawl4ai (see `pipeline/requirements.txt`). Run from the repo root or ensure crawl4ai is installed.

---

## Step 2: Schema generation and JSON extraction from HTML

**Scripts:** `generate_extraction_schema.py`, `extract_from_html.py`

### 2a. Generate extraction schema

Produces an extraction schema (saved as JSON) that you can tune and then use in step 2b. The built-in instructions ask the LLM to use **CSS selectors only** (no XPath) and to extract all list items (images, documents, websites, adapt_options) and to structure contact as much as possible. If the LLM returns XPath, the script tries to convert common patterns to CSS.

**From repo root:**

```bash
# Using a local HTML file (recommended: use your source of truth)
python pipeline/generate_extraction_schema.py --html pipeline/source_html/page_1.html --output pipeline/extraction_schema_generated.json

# Or fetch from a live URL
python pipeline/generate_extraction_schema.py --url "https://climate-adapt.eea.europa.eu/en/metadata/case-studies/..." --output pipeline/extraction_schema_generated.json
```

**Options:** `--url`, `--html`, `--output`, `--provider` (default `openai/gpt-4o`).  
Requires `OPENAI_API_KEY` in `pipeline/.env` or repo `.env`.

After generation, you can edit `extraction_schema_generated.json` (e.g. fix selectors or add fields) and use it in step 2b.

### 2b. Extract JSON from HTML

Reads HTML from `source_html/`, runs the schema (CSS or XPath), adds `fulltext` as **article-only text** (article-only extraction: target elements `.db-item-view` and `#page-header`, excluded nav/footer/header, then PruningContentFilter + markdown). Writes one JSON file per page under `extracted/`. Optionally writes article markdown (e.g. `page_0.md`) with `--markdown`.

**From repo root:**

```bash
python pipeline/extract_from_html.py
# Also write article markdown:
python pipeline/extract_from_html.py --markdown
```

**Options:**

| Option     | Default                           | Description                    |
|------------|-----------------------------------|--------------------------------|
| `--input`  | `pipeline/source_html`             | Directory of HTML files        |
| `--output` | `pipeline/extracted`               | Directory for output JSON      |
| `--schema` | `pipeline/extraction_schema_generated.json` | Schema path             |
| `--pattern`| `page_*.html`                     | Glob for HTML files            |
| `--start`  | 0                                 | First file index (0-based)    |
| `--end`    | (all)                             | Last file index (exclusive)   |
| `--markdown` | (off)                           | Also write `<stem>.md` with article text |

**Output:** `extracted/page_0.json`, `extracted/page_1.json`, … each with:
- **DB-ready metadata:** `source_url` (from `source_html/url_manifest.json`, written in Step 1), `source_file` (path to HTML relative to repo root), `lang` (from `<html lang="...">`, default `en`).
- `fulltext` (article body only) plus all schema fields (title, subtitle, images, adapt_options, contact, websites, references, creation_date, keywords, climate_impacts, adaptation_approaches, sectors, governance_level, case_study_documents, geographic_characterisation, etc.).
- **`gallery_images[]`** — ordered list of hero + gallery images parsed from the `window.__data` JSON blob embedded in the HTML. Each entry has `position`, `source_url` (rewritten to the `huge` Plone scale where possible), `source_url_fallback`, `title`, `description`, `credits`, `content_type`, `width`, `height`. Pages where `window.__data` is missing or unparseable get `gallery_images: []` with a warning logged to stderr; they do **not** fail the run. This field is the input for Step 2c.

If `url_manifest.json` is missing, `source_url` is empty. If the schema uses XPath selectors, the script uses JsonXPathExtractionStrategy; otherwise JsonCssExtractionStrategy.

---

## Step 2c: Download gallery images (local cache + manifests)

**Script:** `download_images.py`

Reads `gallery_images[]` from every `extracted/page_*.json` and downloads each image into `pipeline/images/<slug>/NN.<ext>` (where `<slug>` is the trailing segment of the article URL and `NN` is the zero-padded `position`). Alongside the binaries it writes `pipeline/images/<slug>/manifest.json`, which is the input that the TS loader in Step 5 consumes to upload into Supabase Storage and fill `knowledge.document_images`.

**From repo root:**

```bash
python pipeline/download_images.py
```

Defaults process every `extracted/page_*.json` in parallel-by-article (one HTTP client, one article at a time). The run is idempotent: when an image file already exists on disk the HTTP fetch is skipped but the manifest row is regenerated from the cached file. Use `--force` to invalidate the cache and re-fetch everything.

**Options:**

| Option        | Default                  | Description                                                                 |
|---------------|--------------------------|-----------------------------------------------------------------------------|
| `--pages-dir` | `pipeline/extracted`     | Directory containing `page_*.json` produced by Step 2b                      |
| `--out-dir`   | `pipeline/images`        | Root directory for downloaded images (one subdir per article `<slug>`)      |
| `--pattern`   | `page_*.json`            | Glob for page JSON under `--pages-dir`                                       |
| `--only`      | (all)                    | Process a single article, matched by either the JSON stem or the URL slug   |
| `--force`     | (off)                    | Re-download even when the cached file already exists                         |

**Per-article manifest** (`pipeline/images/<slug>/manifest.json`):

```json
{
  "slug": "…",
  "source_url": "https://climate-adapt.eea.europa.eu/…",
  "page_file": "page_42.json",
  "images": [
    {
      "position": 0,
      "source_url": "https://…/@@images/primary_photo-1920-…png",
      "local_path": "pipeline/images/<slug>/00.png",
      "storage_path_hint": "climateadapt/<slug>/00.png",
      "title": "…",
      "description": "…",
      "credits": "© …",
      "content_type": "image/png",
      "bytes": 3224181,
      "width": 1500,
      "height": 1000
    }
  ]
}
```

Articles with no images still get a manifest with `"images": []` so Step 5 can tell "no images known" apart from "image pipeline did not run".

**Exit codes:** `0` on success (or when every processed article had an empty gallery); `1` only when at least one article had images and every single image download failed across the whole run.

**Requirements:** `httpx` (listed in `pipeline/requirements.txt`). No API keys needed — the Climate-ADAPT image endpoints are public.

---

## Step 3: Augment with AI

**Script:** `augment_with_ai.py`

Reads JSON from `extracted/`, augments English records (geocoding, implementation years, preprocessing of references/contact). Writes `*_en_augmented.json` into `augmented/`. Uses Gemini and optional caches under `pipeline/caches/`. Requires `GEMINI_API_KEY` (and optionally `ARCGIS_API_KEY` for geocoding) in `pipeline/.env` or repo `.env`.

**From repo root:**

```bash
python pipeline/augment_with_ai.py
```

**Options:** `--input` (default `pipeline/extracted`), `--output` (default `pipeline/augmented`), `--pattern` (default `page_*.json`).

---

## Step 4: Translate augmented JSON

**Script:** `translate_augmented.py`

Reads `*_en_augmented.json` from `augmented/`, translates title, subtitle, summary, fulltext into the target language (e.g. Spanish). Writes `*_en_augmented_es.json` in the same directory. Uses Gemini; translations are cached. Requires `GEMINI_API_KEY`.

**From repo root:**

```bash
python pipeline/translate_augmented.py
```

**Options:** `--input` (default `pipeline/augmented`), `--lang` (e.g. `es`), etc. See script help.

---

## Step 5: Load into database (and upload images)

The loader and embedding generation live in **`packages/db`**, not in this folder. From the repo root:

```bash
cd packages/db && pnpm db:create   # create schema (once; destructive — drops + recreates)
cd packages/db && pnpm db:push     # read pipeline/augmented/ + pipeline/images/, insert into DB
```

`pnpm db:push` reads `pipeline/augmented/*_en_augmented.json` (and the matching `*_es` translations), upserts `knowledge.documents` / `knowledge.summary` / `knowledge.fulltext` / `knowledge.recipe`, computes embeddings, and **also**:

1. Derives `<slug>` from each document's `source_url`.
2. Reads `pipeline/images/<slug>/manifest.json` produced by Step 2c.
3. Uploads each local image into the `article-images` Supabase Storage bucket at `climateadapt/<slug>/NN.<ext>` (using `upsert: true`, so re-runs overwrite).
4. Replaces the rows in `knowledge.document_images` for that document in a single transaction (`DELETE` then batched `INSERT`), so galleries stay consistent even when an article adds or loses images between runs.

Image sync is **best-effort per document**: if a single manifest is missing or an upload fails, the script logs a warning and continues with the next document; it never aborts the batch.

**Required environment variables** (in `.env` at the repo root):

| Variable                     | Purpose                                                          |
|------------------------------|------------------------------------------------------------------|
| `DATABASE_URL`               | Direct Postgres URI for `knowledge.*` upserts                    |
| `SUPABASE_URL`               | Supabase project URL — used by the Storage client                |
| `SUPABASE_SERVICE_ROLE_KEY`  | Server-only secret; required to upload into `article-images`     |

If the two Supabase variables are missing the loader still pushes documents but logs a warning per article and skips the image sync.

**One-time bucket setup:** apply `packages/supabase-setup/sql/08_article_images_storage.sql` via the Supabase SQL editor (or your usual SQL-apply flow) to create the public `article-images` bucket with its MIME/size limits. The bucket is public-read because the original Climate-ADAPT images are already served publicly.

See `packages/db/README.md` for details on the loader internals and embedding generation.
