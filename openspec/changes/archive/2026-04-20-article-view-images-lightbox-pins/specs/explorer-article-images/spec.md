# explorer-article-images Specification

## Purpose

Define how explorer article summary views expose **all** images for a knowledge document, allow **full-size inspection** via a shared lightbox, and scope **pin** actions to **individual** images when viewed under `ArticleViewAI`.

## ADDED Requirements

### Requirement: Summary view lists every available document image

The article summary UI (`ArticleSummaryView` or successor used under `ArticleViewAI`) SHALL render every image URL resolved for the current document: the primary `image_url` when present, plus distinct image URLs discovered in `fulltext` HTML when present. URLs SHALL be deduplicated by normalized string comparison and ordered with the primary `image_url` first when it is included. The UI SHALL NOT show a static video placeholder unless the product defines a real video URL field for that document (out of scope for this requirement).

#### Scenario: Multiple images from body HTML appear in the gallery

- **WHEN** `image_url` is set and `fulltext` contains additional distinct `<img src="...">` URLs
- **THEN** the summary SHALL display a thumbnail for each distinct URL and SHALL NOT omit URLs solely because they appear only in `fulltext`

#### Scenario: No misleading empty video tile

- **WHEN** the document has no video resource for the summary strip
- **THEN** the UI SHALL NOT render a decorative video placeholder next to images as if video were available

### Requirement: Thumbnail opens reusable lightbox at full size

Each rendered image thumbnail SHALL be activatable to open a reusable lightbox component that displays the same image scaled to fit the viewport (preserving aspect ratio) on a dimmed backdrop. The user SHALL be able to close the lightbox via an explicit close control, clicking the backdrop, and the Escape key. Focus SHALL be managed in line with modal accessibility patterns (e.g. focus trap while open).

#### Scenario: User opens and closes lightbox

- **WHEN** the user activates a thumbnail in the summary image gallery
- **THEN** the lightbox SHALL show that image at large size and closing SHALL return focus to a sensible element without leaving the article view

### Requirement: Each image is individually wrapped for pinning

Each thumbnail in the summary image gallery SHALL be wrapped in a pin-capable container that pins **that image element** (image `body_kind` / image pin semantics) and SHALL receive parent article context from `ArticleViewAI` when available so `source_document_uid` and composed `source_title_snapshot` match existing article-block pin rules.

#### Scenario: User pins one of several images

- **WHEN** an authenticated user pins from the pin control on a specific image thumbnail in the gallery
- **THEN** the created pin SHALL reference that image’s URL (and alt when available) and SHALL include the parent document’s `document_uid` as `source_document_uid` when the article context is provided
