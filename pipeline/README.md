# Data pipeline (structured, reproducible)

This folder holds the pipeline from Climate-ADAPT URLs to JSON ready for the database. Each step is a separate script; outputs are stored in predictable locations. For the full ordered process see the [repo root README](../README.md).

**CSV de URLs:** Step 1 reads a CSV whose first column is "About" (one URL per row). Default: `pipeline/data-5.csv`. Override with `--csv` if needed.

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

If `url_manifest.json` is missing, `source_url` is empty. If the schema uses XPath selectors, the script uses JsonXPathExtractionStrategy; otherwise JsonCssExtractionStrategy.

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

## Step 5: Load into database

The loader and embedding generation live in **`packages/db`**, not in this folder. From the repo root:

```bash
cd packages/db && pnpm db:create   # create schema (once)
cd packages/db && pnpm db:push     # read pipeline/augmented/, insert into DB and compute embeddings
```

See `packages/db/README.md` for details.
