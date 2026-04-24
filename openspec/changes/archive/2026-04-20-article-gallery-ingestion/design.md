## Context

The Climate-ADAPT scraping pipeline (`pipeline/fetch_html.py` → `pipeline/extract_from_html.py` → `pipeline/augment_with_ai.py` → `pipeline/translate_augmented.py` → `packages/db/src/push-climate-adapt.ts`) ingests one image per article because the extraction schema uses CSS selectors and the gallery on Climate-ADAPT is populated client-side by React only after the user clicks the lightbox. As a result `knowledge.documents.image_url` holds a single hero image, and the explorer UI shows only that one image even though the source case study normally has three to five.

Climate-ADAPT is a Volto/Plone SSR app: the server response embeds the Redux store as `<script>window.__data = {…}</script>`, which is already present in every `pipeline/source_html/page_N.html` we've saved. That payload contains:

- `content.data.cca_gallery[]`: ordered array of `{ url, title, description, rights }` where `url` points to the `@@images/image/large` Plone scale.
- `content.data.cca_gallery_urls[]`: the same URLs without metadata (ignore in favor of `cca_gallery`).
- `content.data.primary_photo`: hero image with `content-type`, `width`, `height`, `size`, `filename`, `download` (unscaled), and a full `scales` table (`huge`, `great`, `larger`, `large`, `preview`, `teaser`, `thumb`, etc.).
- `content.data.primary_photo_copyright`: free-text credits string for the hero.
- `content.data.cca_files[]`: linked document attachments. Out of scope for this change.

No production data exists yet, so we can redesign the DB shape freely and drop the now-redundant single-image column.

## Goals / Non-Goals

**Goals:**
- Ingest the full ordered gallery (hero + gallery items) for each Climate-ADAPT case study.
- Host a self-served copy of each image in a public Supabase Storage bucket so the explorer UI is resilient to Climate-ADAPT uptime, CORS, and hot-link limits.
- Expose an ordered array of image records with caption metadata (title, description, credits) via PostgREST to the frontend.
- Keep the existing pipeline shape (separate, re-runnable Python steps writing to disk) and the existing single TS loader as the only writers to the DB and the bucket.
- Preserve the per-image pin + lightbox behavior that `ArticleSummaryView` already provides, sourced from the new data shape.

**Non-Goals:**
- Capturing non-image payload fields from `window.__data` (e.g. `cca_files`, the richer `content.data` text blocks, `cca_last_modified`, `cca_published`). Future change.
- Fully replacing the CSS-selector extraction with a `window.__data`-driven extractor. Future change.
- Generating responsive `srcset` variants in the bucket. Single "biggest available" scale per image.
- Backwards-compatibility for any external consumer of `knowledge.documents.image_url` — there is none.
- Backfilling existing rows. A fresh `db:push` reproduces everything.

## Decisions

### Decision 1 — Parse `window.__data` inside the existing extraction step

The raw HTML we already saved in Step 1 contains the full Volto initial state. We extend `pipeline/extract_from_html.py` to pull the JSON assigned to `window.__data` and write an ordered `gallery_images[]` field into each `extracted/page_N.json`.

**Alternatives considered:**
- **Second fetch step (plain HTTP GET without headless browser)** — rejected: redundant, since `source_html/` already has the payload. Investigation confirmed `<script>window.__data=…</script>` is present in every file.
- **Keep the existing CSS `images` selector** — rejected: the gallery is React-rendered only after click; the selector reliably returns `[]`.
- **Run JS in a sandbox (py_mini_racer / js2py)** — rejected: `window.__data` is JSON with quoted keys and escaped slashes; `json.loads` works after a narrow regex extraction. A one-line replace handles the only non-JSON token observed in samples (`"state": undefined` under `router.location`).

### Decision 2 — Download locally in Python, upload from local in TS

Split the work:

- `pipeline/download_images.py` reads `extracted/page_N.json#gallery_images`, downloads each binary to `pipeline/images/<slug>/NN.<ext>`, and writes a sibling `pipeline/images/<slug>/manifest.json` capturing `{ position, source_url, storage_path_hint, title, description, credits, content_type, bytes, width?, height? }`.
- `packages/db/src/push-climate-adapt.ts` reads `pipeline/images/<slug>/manifest.json`, uploads each local binary to the `article-images` bucket with `upsert: true`, resolves the public URL via the Supabase JS SDK, and upserts the `knowledge.document_images` rows.

**Alternatives considered:**
- **Python step writes straight to Supabase** — rejected: would add the Supabase Python SDK + service-role key handling in Python, and lose the local cache we can inspect/replay.
- **TS loader fetches from Climate-ADAPT directly** — rejected: re-introduces scraping inside the DB loader, ties bucket uploads to Climate-ADAPT availability at `db:push` time, and drops the reproducibility of a local cache.

### Decision 3 — `knowledge.document_images` table (not an array column)

A dedicated table per image holds URL, storage metadata, and caption metadata. Position is the primary ordering key; position 0 is always the hero by convention, no `role` discriminator needed.

```sql
CREATE TABLE knowledge.document_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE,
  position      INT  NOT NULL,
  source_url    TEXT NOT NULL,     -- Climate-ADAPT origin URL (huge scale)
  storage_path  TEXT NOT NULL,     -- 'climateadapt/<slug>/NN.<ext>' inside bucket
  public_url    TEXT NOT NULL,     -- Supabase storage public URL
  title         TEXT,              -- cca_gallery[i].title (gallery) / document title (hero)
  description   TEXT,              -- cca_gallery[i].description
  credits       TEXT,              -- cca_gallery[i].rights OR primary_photo_copyright
  content_type  TEXT,              -- 'image/png', 'image/jpeg', …
  width         INT,               -- known for hero (from __data); NULL for gallery
  height        INT,               -- known for hero; NULL for gallery
  bytes         INT,               -- captured from HTTP response
  UNIQUE (document_id, position)
);
CREATE INDEX document_images_document_id_position_idx
  ON knowledge.document_images (document_id, position);
```

**Alternatives considered:**
- **`TEXT[] image_urls` on `documents`** — rejected now that the captions/credits are available; an array column would throw that metadata away.
- **JSONB column on `documents`** — rejected: per-image fields are well-typed and frequently joined by position; a normalized table is simpler for PostgREST and for future constraints (e.g. a trigger to ensure position 0 exists).
- **Keep `documents.image_url` for back-compat** — rejected by product: no production data.

### Decision 4 — Public Supabase Storage bucket

`article-images`, public, 20 MiB per object, MIME allowlist `image/jpeg, image/png, image/webp`. No RLS needed on read (public); writes are service-role only (default). Path convention: `climateadapt/<slug>/NN.<ext>` with a two-digit zero-padded index so natural string sort = position sort. SQL lives at `packages/supabase-setup/sql/08_article_images_storage.sql`, mirroring `07_human_pin_storage.sql`.

**Alternatives considered:**
- **Private bucket with signed URLs** — rejected: the images are already public on Climate-ADAPT; a signed-URL dance for every article card and lightbox open adds latency and server logic with no privacy benefit.
- **Per-user folder RLS** — not applicable; these are project-owned assets.

### Decision 5 — One variant per image, biggest available

Hero picks `primary_photo.scales.huge.download`, falling back in order: `scales.great.download` → `scales.larger.download` → `scales.large.download` → `primary_photo.download`. Gallery items start from `cca_gallery[i].url` (which ends in `/@@images/image/large`) and rewrite the trailing scale segment to `/huge`. The rewrite is safe because Plone generates scales on demand; if `/huge` unexpectedly 404s, the downloader falls back to the original `/large` URL.

**Alternatives considered:**
- **Full responsive ladder** (thumb + medium + huge) with `srcset` — rejected as over-engineering for the current UI (thumbnails are 128px cards; lightbox is one image at a time). Future change if mobile page-weight becomes a problem.
- **Always use `primary_photo.download`** — rejected for gallery items: the `cca_gallery` URL format doesn't include that endpoint; it uses the `/@@images/image/<scale>` scheme. Keeping the two paths symmetrical via the `/huge` scale name is simpler.

### Decision 6 — DELETE + INSERT per document in the loader

When upserting `document_images` during `push-climate-adapt.ts`, we `DELETE FROM knowledge.document_images WHERE document_id = $1` and then insert the current set. This keeps the table in sync when galleries shrink between runs, avoids write-skew from `ON CONFLICT (document_id, position)` on a shrinking list, and is safe under `ON DELETE CASCADE`.

### Decision 7 — Frontend reads `document.images[]`

The three public SQL functions (`get_all_documents`, `get_documents_by_ids`, `get_document_by_uid`) stop returning `image_url` and start returning an `images jsonb` column computed as:

```sql
(SELECT jsonb_agg(
   jsonb_build_object(
     'position', di.position,
     'public_url', di.public_url,
     'title', di.title,
     'description', di.description,
     'credits', di.credits,
     'content_type', di.content_type,
     'width', di.width,
     'height', di.height
   ) ORDER BY di.position
 ) FROM knowledge.document_images di WHERE di.document_id = d.id) AS images
```

The frontend `mapKnowledgeRowToArticleDocument` util lifts `images` onto the article document. `ArticleSummaryView` and any other reader of the old `image_url` iterate `document.images`. `useDocumentImageUrls` is deleted.

## Risks / Trade-offs

- **`window.__data` parser brittleness** → Mitigation: target the narrowest regex that locates `<script[^>]*>window\.__data\s*=\s*({.*?})</script>` with a small brace-counting helper (script tag has no nested `</script>`). Fall back to per-item CSS extraction if parsing fails; log and skip only the images for that article.
- **Climate-ADAPT changes the `@@images/image/huge` contract** → Mitigation: the downloader falls back to the original `cca_gallery[i].url` (the `/large` variant we already know works) before giving up.
- **Large bucket footprint** → Accepted: ~147 articles × ~4 images × ~1-3 MB ≈ <2 GB, well within Supabase free-tier limits.
- **Lost caption data if `cca_gallery` is absent on older content** → Mitigation: fall back to `primary_photo` only (hero at position 0 with `primary_photo_copyright` as `credits`) and let the document have zero gallery rows; the explorer UI already has an empty-state tile.
- **Pins on per-image thumbnails capture snapshots of the old URL scheme** → No impact: pin payloads embed the URL by value at pin time, so existing pins (none yet in production) would keep resolving against their snapshot URL; new pins will capture the bucket public URL naturally.
- **Re-running `db:push` after editing an article's gallery leaves local images stale** → Accepted: `download_images.py --force` re-downloads; `push-climate-adapt.ts` `upsert: true` on storage and DELETE+INSERT on DB keeps the DB truth aligned with the latest local cache.

## Migration Plan

No production data. Fresh `db:drop && db:create && pipeline runs && db:push` is the migration. For local dev:

1. Pull the branch; run `openspec apply`-equivalent.
2. `pnpm -F @farclimate/db db:drop` (if schema already exists locally) then `pnpm -F @farclimate/db db:create` to rebuild with the new schema.
3. Apply `packages/supabase-setup/sql/08_article_images_storage.sql` via the Supabase SQL editor or migration runner to create the bucket and its policies.
4. Re-run `python pipeline/extract_from_html.py` to repopulate `extracted/*.json` with `gallery_images[]`.
5. Run `python pipeline/download_images.py` to fill `pipeline/images/<slug>/`.
6. Run `pnpm -F @farclimate/db db:push` to upload binaries + populate `document_images`.

Rollback is trivial: `db:drop` + revert the SQL files + revert the frontend types. The bucket can be emptied via Supabase dashboard or left in place (costs nothing idle).

## Open Questions

None blocking. Follow-ups captured in the proposal's out-of-scope list: `cca_files` ingestion, full `window.__data`-based extraction, responsive variants.
