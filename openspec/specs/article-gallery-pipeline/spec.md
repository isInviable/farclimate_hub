# article-gallery-pipeline Specification

## Purpose

Define how the Python ingestion pipeline extracts all available images for each Climate-ADAPT article (hero + gallery) from the server-rendered `window.__data` payload and caches their binaries on disk, producing a per-article `manifest.json` that the TypeScript loader consumes to populate `knowledge.document_images` and the `article-images` Supabase Storage bucket.

## Requirements

### Requirement: Pipeline extraction parses `window.__data` for gallery images

The `pipeline/extract_from_html.py` script SHALL locate the `<script>` tag containing `window.__data = {…}` inside each saved `pipeline/source_html/page_N.html`, parse that JSON object, and emit an ordered `gallery_images` array into the corresponding `pipeline/extracted/page_N.json`. Each element SHALL be an object with keys `position` (0-based integer), `source_url` (string), `title` (string or null), `description` (string or null), `credits` (string or null), and optionally `width`/`height`/`content_type` when provided by the source. Position 0 SHALL be the hero image when one is available; positions 1..N SHALL preserve the order of `content.data.cca_gallery`.

#### Scenario: Article with primary photo and cca_gallery
- **WHEN** `extract_from_html.py` runs against an HTML file whose `window.__data` contains both `content.data.primary_photo` and a non-empty `content.data.cca_gallery` of length 3
- **THEN** the resulting `extracted/page_N.json` SHALL contain `gallery_images` of length 4, with `gallery_images[0].source_url` equal to the best available hero scale and `gallery_images[1..3]` in the same order as `cca_gallery`, each carrying that item's `title`, `description`, and `rights` mapped to `credits`

#### Scenario: Article with only a primary photo
- **WHEN** the article exposes `primary_photo` but `cca_gallery` is absent or empty
- **THEN** `gallery_images` SHALL contain exactly one entry at position 0 sourced from the primary photo, with `credits` set from `content.data.primary_photo_copyright` when present

#### Scenario: Article with only cca_gallery and no primary photo
- **WHEN** `primary_photo` is absent but `cca_gallery` contains items
- **THEN** `gallery_images` SHALL contain one entry per gallery item starting at position 0, preserving the source order

#### Scenario: Article without any image metadata
- **WHEN** neither `primary_photo` nor `cca_gallery` is present in `window.__data`
- **THEN** `gallery_images` SHALL be an empty array and extraction SHALL NOT fail

#### Scenario: Malformed or missing window.__data
- **WHEN** the HTML lacks the `window.__data` script or the JSON fails to parse
- **THEN** extraction SHALL log a warning scoped to that page, emit `gallery_images: []`, and continue processing remaining pages

### Requirement: Hero image URL uses the largest available Plone scale

For the hero image (position 0 when sourced from `primary_photo`), `source_url` SHALL be resolved in the following priority order: `primary_photo.scales.huge.download`, `primary_photo.scales.great.download`, `primary_photo.scales.larger.download`, `primary_photo.scales.large.download`, and finally `primary_photo.download`. When a preferred scale is absent in the JSON, the next available one SHALL be used.

#### Scenario: Huge scale available
- **WHEN** `primary_photo.scales.huge.download` is present
- **THEN** `gallery_images[0].source_url` SHALL equal that URL

#### Scenario: Only the unscaled download is available
- **WHEN** `primary_photo.scales` is absent but `primary_photo.download` is set
- **THEN** `gallery_images[0].source_url` SHALL equal `primary_photo.download`

### Requirement: Gallery image URLs are rewritten to the `huge` Plone scale

For each entry sourced from `cca_gallery`, `source_url` SHALL be derived from `cca_gallery[i].url` by replacing the trailing `/@@images/image/<scale>` segment with `/@@images/image/huge`. The original `cca_gallery[i].url` SHALL be retained in a sibling field `source_url_fallback` inside the `gallery_images` entry so a subsequent step can retry at the original `/large` scale if `/huge` is unavailable.

#### Scenario: URL ends in /large
- **WHEN** `cca_gallery[i].url` ends with `/@@images/image/large`
- **THEN** the emitted `source_url` SHALL end with `/@@images/image/huge` and `source_url_fallback` SHALL equal the original URL

#### Scenario: URL already at a non-large scale
- **WHEN** `cca_gallery[i].url` ends with `/@@images/image/<other>` where `<other>` is not `huge`
- **THEN** the `<other>` segment SHALL be replaced with `huge` and the original URL retained as `source_url_fallback`

### Requirement: Downloader step caches image binaries on disk with a manifest

A new script `pipeline/download_images.py` SHALL read each `extracted/page_N.json`, download every `gallery_images[].source_url` into `pipeline/images/<slug>/NN.<ext>` (where `<slug>` is the article's URL slug and `NN` is the zero-padded position), and write `pipeline/images/<slug>/manifest.json` capturing `position`, `source_url`, `storage_path_hint`, `title`, `description`, `credits`, `content_type`, and `bytes` for each downloaded item. The extension `<ext>` SHALL be derived from the HTTP `Content-Type` response header, falling back to the extension of the URL path. The script SHALL be idempotent: if the local file already exists and `--force` is not passed, the download SHALL be skipped but the manifest entry SHALL still be regenerated from the existing file's stat and recorded content type. When the HTTP `Content-Type` is unavailable (e.g. because the download step was skipped by the cache), the manifest's `content_type` SHALL be inferred from the local file extension using the same allow-list as the bucket (`.png`→`image/png`, `.jpg`/`.jpeg`→`image/jpeg`, `.webp`→`image/webp`), so that re-runs never produce manifest entries without a usable `content_type`.

#### Scenario: Fresh download populates disk
- **WHEN** `download_images.py` runs for an article with no prior local cache
- **THEN** the directory `pipeline/images/<slug>/` SHALL contain one file per `gallery_images` entry plus a `manifest.json` whose entries agree with the on-disk filenames

#### Scenario: Re-run without --force skips existing files
- **WHEN** `download_images.py` runs a second time without `--force` and the on-disk files still exist
- **THEN** no HTTP request SHALL be issued for already-present files, and `manifest.json` SHALL be rewritten with bytes and content type reflecting the cached files

#### Scenario: Cached file with no HTTP headers gets MIME from extension
- **WHEN** a manifest entry is regenerated from a cached file so no HTTP `Content-Type` is available
- **THEN** `content_type` SHALL be inferred from the file extension (`image/jpeg` for `.jpg`/`.jpeg`, `image/png` for `.png`, `image/webp` for `.webp`) instead of being omitted or set to `application/octet-stream`

#### Scenario: Huge scale returns 404, fallback succeeds
- **WHEN** a download of `source_url` fails with a non-2xx status
- **THEN** the script SHALL retry once against `source_url_fallback` when that field is present, and record the successfully downloaded URL into the manifest's `source_url`

#### Scenario: Single image fails after fallback
- **WHEN** both `source_url` and `source_url_fallback` fail for one entry
- **THEN** that entry SHALL be omitted from `manifest.json`, the remaining entries SHALL still be written, and the script SHALL exit with a non-zero status only when every image in the article fails

#### Scenario: Position numbering matches gallery order
- **WHEN** an article has four `gallery_images` entries
- **THEN** the local files SHALL be named `00.<ext>`, `01.<ext>`, `02.<ext>`, `03.<ext>` and `manifest.json` SHALL list them in that order with matching `position` values
