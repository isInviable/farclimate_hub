## Why

Articles ingested from Climate-ADAPT show only a single image in the explorer even though most case studies carry 3–5 images in an on-site lightbox gallery. Our pipeline's CSS-selector extractor misses them because the gallery is populated client-side by React; the frontend has papered over this with a regex over `fulltext` that, in practice, never finds any extras.

Each saved `source_html/page_N.html` already contains the server-rendered Volto/Plone initial state as `<script>window.__data = {…}</script>`, which includes `content.data.cca_gallery` (ordered URLs + title + description + rights) and `content.data.primary_photo` (with per-scale download URLs up to `huge`). Parsing that blob unlocks the full gallery without a second network fetch, and mirroring the images into a Supabase storage bucket makes the explorer independent of Climate-ADAPT uptime, CORS, and hot-link throttling.

## What Changes

- **NEW — Pipeline parses `window.__data`**: `pipeline/extract_from_html.py` extracts the JSON assigned to `window.__data`, then writes an ordered `gallery_images[]` into each `extracted/page_N.json` with `{ source_url, title, description, credits, content_type?, width?, height?, bytes? }`. Hero (from `primary_photo.scales.huge.download`, falling back down the Plone scale ladder) is always at position 0; gallery items (from `cca_gallery`, rewriting the URL scale from `/large` to `/huge`) follow.
- **NEW — Pipeline downloads images locally**: a new `pipeline/download_images.py` step reads `gallery_images[]`, downloads each binary to `pipeline/images/<slug>/NN.<ext>`, and writes a per-article `manifest.json` sidecar with the metadata above plus the local path. Step is idempotent; `--force` re-downloads.
- **NEW — `article-images` public Supabase Storage bucket**: created via `packages/supabase-setup/sql/08_article_images_storage.sql`, mirroring the style of `07_human_pin_storage.sql`. Public read, service-role write, 20 MiB per object, image MIME allowlist. Path convention `climateadapt/<slug>/NN.<ext>`.
- **NEW — `knowledge.document_images` table**: ordered rows per document with `source_url`, `storage_path`, `public_url`, `title`, `description`, `credits`, `content_type`, `width`, `height`, `bytes`. One DB row per image.
- **BREAKING — Drop `knowledge.documents.image_url`**: single-image column removed. No production data yet, so no back-compat layer. All three public API functions (`get_all_documents`, `get_documents_by_ids`, `get_document_by_uid`) stop returning `image_url` and start returning an `images` JSON array built from `document_images` ordered by `position`.
- **BREAKING — Frontend consumes `document.images[]`**: `ArticleSummaryView.vue` (and the summary-card / instagram view-mode and any other places that read `image_url`) switch to iterate `document.images`. The `useDocumentImageUrls` composable is deleted; fulltext-regex fallback goes away. Lightbox and per-image pin buttons now use `images[i].public_url`, `images[i].title`, `images[i].description`, `images[i].credits`.
- **NEW — TS loader uploads from local**: `packages/db/src/push-climate-adapt.ts` reads `pipeline/images/<slug>/manifest.json` for each document, uploads each local file to the bucket with `upsert: true`, resolves the public URL via `storage.getPublicUrl`, then upserts rows into `knowledge.document_images` (DELETE + INSERT scoped per document so shrinking galleries don't leave orphans).

Out of scope (future changes): capturing `cca_files` (PDF attachments), switching the rest of the extraction from CSS selectors to `window.__data`, richer responsive `srcset` variants in the bucket.

## Capabilities

### New Capabilities
- `article-gallery-pipeline`: parsing `window.__data` from saved Climate-ADAPT HTML into an ordered `gallery_images[]` in the per-article JSON, and downloading each image binary to a local cache directory with a manifest.
- `article-gallery-storage`: public Supabase Storage bucket `article-images`, the `knowledge.document_images` table shape and its `get_*` public API function outputs, and the TS loader step that uploads local files + upserts DB rows.

### Modified Capabilities
- `explorer-article-images`: consumption source changes from `{ image_url, fulltext }` (hero + fulltext-regex) to `document.images[]` (ordered array with per-image `public_url`, `title`, `description`, `credits`). The `useDocumentImageUrls` composable is removed; the empty-state, pin-per-image, and lightbox behavior are preserved but driven by the new shape.
- `consolidated-knowledge-schema`: adds `knowledge.document_images` as a new per-document table, removes `knowledge.documents.image_url`, and extends the three `get_*` public API functions to return an `images jsonb` aggregated from `document_images` ordered by `position` instead of `image_url`.

## Impact

**Code**
- `pipeline/extract_from_html.py` (new `window.__data` parser + new output field)
- `pipeline/download_images.py` (new)
- `pipeline/requirements.txt` (add `httpx` if not present; no Pillow)
- `packages/db/sql/02_tables.sql` (drop `image_url`, add `document_images` table + indexes)
- `packages/db/sql/06_public_api.sql` (rewrite three `get_*` functions)
- `packages/db/src/push-climate-adapt.ts` (remove `image_url` upsert; add bucket upload + `document_images` upsert from manifest)
- `packages/db/src/config.ts` or env — Supabase service-role credentials already available; no new secret
- `packages/supabase-setup/sql/08_article_images_storage.sql` (new)
- `apps/web/app/components/explorer/ArticleSummaryView.vue` (consume `document.images[]`)
- `apps/web/app/components/explorer/ArticleView.vue`, `apps/web/app/components/explorer/wf/viewmodes/ViewModeInstagram.vue`, any other `image_url` reader
- `apps/web/app/composables/useDocumentImageUrls.ts` (delete)
- `apps/web/app/types/index.ts`, `apps/web/app/types/search.d.ts` (type of `images`)
- `apps/web/server/utils/knowledgeDocument.ts` (map `images` from RPC rows)

**APIs / contracts**
- PostgREST RPCs `get_all_documents`, `get_documents_by_ids`, `get_document_by_uid` change return columns (BREAKING for any external consumer — none in production).

**Infra**
- Adds one public Supabase Storage bucket, ~147 articles × ~3–4 images × ~1–3 MB ≈ a few hundred MB.

**No impact on** embeddings, augmentation, translations, search ranking, RLS on any other bucket, or the human-pins feature (pin payloads carry image URLs by value, so pinned images keep working with whatever URL was captured at pin time).
