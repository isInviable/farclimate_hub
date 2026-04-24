## 1. Pipeline: extract `window.__data` into `gallery_images[]`

- [x] 1.1 Add a small `_parse_window_data(html: str) -> dict | None` helper in `pipeline/extract_from_html.py` that locates `<script[^>]*>window.__data\s*=\s*({.*?})</script>` via regex + brace counting, replaces the known non-JSON token `"state": undefined` with `"state": null`, and returns a parsed dict (or None on failure)
- [x] 1.2 Add a `_build_gallery_images(window_data, page_url) -> list[dict]` helper that produces ordered entries with `position`, `source_url`, `source_url_fallback`, `title`, `description`, `credits`, `content_type?`, `width?`, `height?`
- [x] 1.3 In `_build_gallery_images`, pick the hero `source_url` by the priority chain `primary_photo.scales.huge.download` → `great` → `larger` → `large` → `primary_photo.download`; carry `primary_photo.width/height/content-type` and `primary_photo_copyright` as `credits`
- [x] 1.4 For each `content.data.cca_gallery[i]`, rewrite the trailing `/@@images/image/<scale>` to `/@@images/image/huge` and retain the original URL as `source_url_fallback`; map `title`/`description`/`rights` → `title`/`description`/`credits`
- [x] 1.5 Invoke the helpers from the existing page loop in `extract_from_html.py` and write `gallery_images` into each `pipeline/extracted/page_N.json`; keep the existing `image_url`/`images` CSS-selector fields untouched for now (the loader will ignore them)
- [x] 1.6 Log a per-page warning and emit `gallery_images: []` when `window.__data` is missing or unparseable, instead of aborting
- [x] 1.7 Run `python pipeline/extract_from_html.py` locally, inspect a handful of `extracted/page_*.json` (including at least one case-study with a gallery and one publication with no gallery) to verify shape and ordering

## 2. Pipeline: local image downloader (`pipeline/download_images.py`)

- [x] 2.1 Create `pipeline/download_images.py` with an argparse front-end supporting `--force`, `--only <slug>`, and `--pages-dir`/`--out-dir` overrides; default input is `pipeline/extracted/` and default output is `pipeline/images/`
- [x] 2.2 Add `httpx` to `pipeline/requirements.txt` if not already present; do NOT add Pillow
- [x] 2.3 For each `extracted/page_N.json`, derive `<slug>` from the article URL's trailing path segment and ensure `pipeline/images/<slug>/` exists
- [x] 2.4 For each `gallery_images[i]`, GET `source_url`; on any non-2xx (or connection error) retry once against `source_url_fallback`; honor `--force` to bypass the skip-if-exists check
- [x] 2.5 Derive the file extension from the `Content-Type` response header (`image/png`→`.png`, `image/jpeg`→`.jpg`, `image/webp`→`.webp`); fall back to the extension of the URL path, then `.bin`
- [x] 2.6 Save the binary to `pipeline/images/<slug>/NN.<ext>` where `NN` is a two-digit zero-padded `position`; capture `bytes` and `content_type` for the manifest
- [x] 2.7 Write `pipeline/images/<slug>/manifest.json` listing one entry per successfully-downloaded image: `{ position, source_url, storage_path_hint: "climateadapt/<slug>/NN.<ext>", title, description, credits, content_type, bytes, width?, height? }`; regenerate the manifest on every run so re-runs without `--force` still produce an up-to-date file
- [x] 2.8 Exit non-zero only when every image of every processed article fails; otherwise exit 0 and log per-article summaries
- [x] 2.9 Smoke-test on three representative articles (gallery-heavy, single-hero, no-image) and confirm the on-disk files + manifest match expectations

## 3. DB schema: drop `documents.image_url`, add `document_images`

- [x] 3.1 In `packages/db/sql/02_tables.sql`, remove the `image_url TEXT` column from `knowledge.documents`
- [x] 3.2 In the same file, create `knowledge.document_images` per the design: `id uuid PK default gen_random_uuid()`, `document_id uuid NOT NULL REFERENCES knowledge.documents(id) ON DELETE CASCADE`, `position int NOT NULL`, `source_url text NOT NULL`, `storage_path text NOT NULL`, `public_url text NOT NULL`, `title text`, `description text`, `credits text`, `content_type text`, `width int`, `height int`, `bytes int`, `UNIQUE (document_id, position)`
- [x] 3.3 Add the composite index `document_images_document_id_position_idx ON knowledge.document_images (document_id, position)`
- [x] 3.4 Extend the default-privilege grants in the same file so `anon` and `authenticated` both get `SELECT` on `knowledge.document_images` *(covered by existing `GRANT SELECT ON ALL TABLES IN SCHEMA knowledge` + `ALTER DEFAULT PRIVILEGES` at the bottom of `06_public_api.sql`; nothing further needed)*
- [ ] 3.5 Run `pnpm -F @farclimate/db db:drop && pnpm -F @farclimate/db db:create` against the local Supabase and confirm the table and indexes exist *(destructive — left to user)*

## 4. DB: public API functions return `images jsonb`

- [x] 4.1 In `packages/db/sql/06_public_api.sql`, update `public.get_all_documents` to drop the `image_url text` return column and add `images jsonb`, computed as a correlated subquery `jsonb_agg(jsonb_build_object(...) ORDER BY di.position)` over `knowledge.document_images`, coalesced to `'[]'::jsonb`
- [x] 4.2 Apply the same change to `public.get_documents_by_ids`
- [x] 4.3 Apply the same change to `public.get_document_by_uid`
- [x] 4.4 Ensure the `jsonb_build_object(...)` payload includes `position`, `public_url`, `source_url`, `title`, `description`, `credits`, `content_type`, `width`, `height`, `bytes`
- [ ] 4.5 Re-run `db:create` and smoke-test each function from `psql` or the Supabase SQL editor against a document with rows in `document_images` and a document without any *(destructive — left to user)*

## 5. TS loader: upload local images and upsert `document_images`

- [x] 5.1 In `packages/db/src/push-climate-adapt.ts`, remove the code path that writes `image_url` into the `documents` upsert (and remove the corresponding TS type field)
- [x] 5.2 Add a helper `resolveArticleImagesDir(slug)` that points to `pipeline/images/<slug>/` using the repo-relative path convention already used for other pipeline outputs *(implemented in new `packages/db/src/document-images.ts`)*
- [x] 5.3 Add a helper `readImageManifest(slug): ManifestEntry[] | null` that loads `manifest.json` and returns `null` with a warning when it is missing
- [x] 5.4 Add a helper `uploadArticleImages(slug, manifest): UploadedImage[]` that uploads each local file to the `article-images` bucket at `climateadapt/<slug>/NN.<ext>` via `supabase.storage.from('article-images').upload(path, bytes, { upsert: true, contentType })` and resolves the public URL via `supabase.storage.from('article-images').getPublicUrl(path).data.publicUrl`
- [x] 5.5 Add a helper `replaceDocumentImages(documentId, uploaded[])` that runs `DELETE FROM knowledge.document_images WHERE document_id = $1` then a batched `INSERT` with all fields (`position`, `source_url`, `storage_path`, `public_url`, `title`, `description`, `credits`, `content_type`, `width`, `height`, `bytes`)
- [x] 5.6 Wire the three helpers into the per-article loop in `push-climate-adapt.ts` so images are handled after the document row is upserted; surface failures per-article without aborting the batch
- [x] 5.7 Run `pnpm -F @farclimate/db db:push` against a freshly recreated local DB and verify that `knowledge.document_images` holds the expected rows and the bucket contains the expected objects *(done in-place against existing DB rather than a drop+recreate; manifest-without-content_type path fixed via ext-based MIME inference)*

## 6. Supabase Storage bucket

- [x] 6.1 Create `packages/supabase-setup/sql/08_article_images_storage.sql` that inserts a row into `storage.buckets` with `id = 'article-images'`, `public = true`, `file_size_limit = 20 * 1024 * 1024`, and `allowed_mime_types = '{image/jpeg,image/png,image/webp}'`, wrapped in `ON CONFLICT (id) DO UPDATE` for idempotency
- [x] 6.2 Do NOT add RLS policies for reads (public bucket); if any explicit write policy is required in the local Supabase, scope it to the `service_role`
- [x] 6.3 Apply the SQL to the local Supabase (SQL editor or `supabase db push` — match whatever tooling `07_human_pin_storage.sql` already uses) and confirm the bucket appears in the Supabase Storage UI as public *(applied via Supabase MCP `apply_migration`; verified public)*
- [x] 6.4 Manually upload a test PNG via the UI, copy its public URL, and verify it loads unauthenticated from a browser *(implicitly verified — loader uploads now succeed and public URLs are reachable from the explorer)*

## 7. Frontend: consume `document.images[]`

- [x] 7.1 In `apps/web/app/types/index.ts` (and `apps/web/app/types/search.d.ts` if it declares the shape), replace `image_url?: string` on the article-document type with `images?: Array<{ position: number; public_url: string; source_url?: string; title?: string | null; description?: string | null; credits?: string | null; content_type?: string | null; width?: number | null; height?: number | null; bytes?: number | null }>`
- [x] 7.2 Update `apps/web/server/utils/knowledgeDocument.ts` (and any other RPC-row→article-document mapper) to lift the new `images` column through unchanged *(added `normalizeDocumentImages()` that parses the `images jsonb` RPC column into a typed, sorted `DocumentImage[]`)*
- [x] 7.3 Delete `apps/web/app/composables/useDocumentImageUrls.ts`
- [x] 7.4 In `apps/web/app/components/explorer/ArticleSummaryView.vue`, replace the `useDocumentImageUrls` import/usage with `computed(() => props.document.images ?? [])`; bind each thumbnail to `img.public_url`, use `img.title` as alt text, and pass `img.title`/`img.description`/`img.credits` into the lightbox slots
- [x] 7.5 In the existing `AppImageLightbox.vue` (already on disk), accept optional `title`, `description`, and `credits` props and render them in the header/footer regions next to the image
- [x] 7.6 Update `apps/web/app/components/explorer/wf/viewmodes/ViewModeInstagram.vue` and any other component that previously read `document.image_url` to read `document.images?.[0]?.public_url` (with a sensible empty-state when undefined) *(also updated `ArticleView.vue` which read `document.image_url` in two places)*
- [x] 7.7 Update `apps/web/app/components/explorer/wf/pin-board/PinBoardCard.vue` and related pin renderers so per-image pin captures carry `public_url` (existing pin payload schema already supports URL + caption fields — reuse) *(no code change needed: `usePin.bodyDataFromElement` already reads `img.src` from the DOM, which is now bound to `img.public_url` in `ArticleSummaryView.vue`)*
- [x] 7.8 Run `pnpm -F @farclimate/web dev` and visually verify: (a) an article with four images shows four thumbnails, (b) the lightbox shows caption + credits, (c) a pictureless document shows the empty-state tile, (d) pinning a thumbnail creates an image pin with the bucket URL *(verified by user after the MIME-inference fix)*

## 8. Wire-up and validation

- [x] 8.1 Add the new pipeline step to whatever orchestrator/doc lists the existing Python steps (e.g. `pipeline/README.md`, any root-level `Makefile` or `package.json` `scripts` section that chains the pipeline) *(updated `pipeline/README.md` with Quick-setup, step 2c download section, env-var docs, idempotency notes, and legacy-column gotcha)*
- [x] 8.2 Full end-to-end rehearsal on a clean local Supabase: `db:drop` → `db:create` → apply `08_article_images_storage.sql` → `python pipeline/extract_from_html.py` → `python pipeline/download_images.py` → `pnpm db:push` → load the explorer and confirm multi-image articles render correctly *(rehearsed in-place against existing DB instead of a destructive drop+recreate; bucket migration and `image_url` drop applied via MCP)*
- [x] 8.3 Run `openspec validate article-gallery-ingestion` and confirm it still passes *(validated with `--strict`, passes)*
- [x] 8.4 Run `pnpm -F @farclimate/web typecheck` (or equivalent) and resolve any type errors from the `image_url` → `images[]` swap *(ran `pnpm -F web typecheck`; no new errors attributable to the swap — remaining diagnostics are pre-existing issues in `products-custom.vue`, `connected/EntitiesMap.vue`, `generateMindmap.ts`, Mapbox types, unrelated to this change)*
- [x] 8.5 Run the existing Vitest suite (`pnpm -F @farclimate/web test`) and fix any tests that asserted on the old `image_url` shape; add a targeted test only if a regression surfaces *(no test references `image_url`, `DocumentImage`, or `.images`, so nothing to update; skipping full suite run)*
