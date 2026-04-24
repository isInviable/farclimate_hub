## MODIFIED Requirements

### Requirement: Summary view lists every available document image

The article summary UI (`ArticleSummaryView` or successor used under `ArticleViewAI`) SHALL render every image in `document.images`, an ordered array supplied by `public.get_document_by_uid` / `public.get_documents_by_ids`. Each element provides `public_url`, and optionally `title`, `description`, `credits`, `content_type`, `width`, and `height`. Thumbnails SHALL appear in `position` order (position 0 first). Rendering SHALL NOT scan `fulltext` for `<img>` tags, SHALL NOT derive a single `image_url` from the document, and SHALL NOT show a static video placeholder unless the product defines a real video URL field for that document (out of scope for this requirement).

#### Scenario: Multiple images render in order
- **WHEN** `document.images` is an array of four entries with positions 0..3
- **THEN** the summary SHALL display four thumbnails in that order, each bound to `images[i].public_url`

#### Scenario: Empty images array shows empty state
- **WHEN** `document.images` is `[]` or absent
- **THEN** the summary SHALL render the existing empty-state tile and SHALL NOT attempt to parse `fulltext` for images

#### Scenario: Captions and credits are surfaced
- **WHEN** an image entry carries `title`, `description`, or `credits`
- **THEN** the UI SHALL expose those fields (e.g. as alt text, tooltip, or caption below the thumbnail) without re-deriving them from HTML

#### Scenario: No misleading empty video tile
- **WHEN** the document has no video resource for the summary strip
- **THEN** the UI SHALL NOT render a decorative video placeholder next to images as if video were available

### Requirement: Thumbnail opens reusable lightbox at full size

Each rendered image thumbnail SHALL be activatable to open a reusable lightbox component that displays the same image (sourced from `images[i].public_url`) scaled to fit the viewport (preserving aspect ratio) on a dimmed backdrop. When available, the lightbox SHALL render `images[i].title` as the header label and `images[i].description` and `images[i].credits` beneath the image. The user SHALL be able to close the lightbox via an explicit close control, clicking the backdrop, and the Escape key. Focus SHALL be managed in line with modal accessibility patterns (e.g. focus trap while open).

#### Scenario: User opens and closes lightbox
- **WHEN** the user activates a thumbnail in the summary image gallery
- **THEN** the lightbox SHALL show that image at large size and closing SHALL return focus to a sensible element without leaving the article view

#### Scenario: Lightbox shows caption metadata when provided
- **WHEN** the selected image has non-null `title`, `description`, or `credits`
- **THEN** the lightbox SHALL render each of those fields once, clearly separated from the image itself

### Requirement: Each image is individually wrapped for pinning

Each thumbnail in the summary image gallery SHALL be wrapped in a pin-capable container that pins **that image element** (image `body_kind` / image pin semantics) and SHALL receive parent article context from `ArticleViewAI` when available so `source_document_uid` and composed `source_title_snapshot` match existing article-block pin rules. The pin payload SHALL carry `images[i].public_url` and, when provided, `images[i].title` as the accessible label.

#### Scenario: User pins one of several images
- **WHEN** an authenticated user pins from the pin control on a specific image thumbnail in the gallery
- **THEN** the created pin SHALL reference that image's `public_url` (and `title` when available) and SHALL include the parent document's `document_uid` as `source_document_uid` when the article context is provided
