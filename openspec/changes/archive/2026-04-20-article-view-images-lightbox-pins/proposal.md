## Why

In `ArticleSummaryView` (used inside `ArticleViewAI`), the short-description area shows only the primary `image_url` beside a static video placeholder, so users see a misleading “gallery” (one real image plus an empty-looking frame with a play affordance). Users need every image associated with the article, a way to inspect images at full resolution, and the ability to pin each image separately with correct parent-document context—consistent with other article blocks.

## What Changes

- Replace the single-thumbnail + static placeholder row with a **media strip or grid** that lists **all** image URLs available for the document (primary `image_url` plus any additional sources defined in design, e.g. from fulltext or structured fields), without dummy video frames unless real video URLs exist.
- Add a **reusable lightbox** component: clicking a thumbnail opens a full-viewport (or near-full) overlay showing the image at full size, with dismiss (backdrop, Esc, close control) and basic a11y (focus trap, dialog role).
- **Pin affordance per image**: each image sits in its own pin-capable wrapper (e.g. `SelectableBlock` with `pin-kind="image"` or an equivalent pattern) so `usePin` captures the correct `<img>` element and `source_document_uid` from `ArticleViewAI`’s provided context.
- Optional follow-through: align copy in i18n if new labels are introduced (e.g. “Open image”, “Close”).

## Capabilities

### New Capabilities

- `explorer-article-images`: Article summary (and related explorer article surfaces) SHALL enumerate all document images, render them in the summary UI, support lightbox viewing, and scope pins to individual images.

### Modified Capabilities

- `human-pins-frontend`: Extend the article-hosted pinning scenarios so that **each image** in the article summary gallery is a distinct pin target with `body_kind` image and `source_document_uid` set when opened from `ArticleViewAI`, rather than only the enclosing short-description block.

## Impact

- **Frontend**: `ArticleSummaryView.vue`, new shared lightbox component under `apps/web/app/components/` (exact path in design), possible small composable for collecting image URLs from a document; `ArticleViewAI.vue` only if context or layout must adjust; i18n keys if needed.
- **Data**: Uses existing `document.image_url` and any additional fields or HTML-derived URLs agreed in design—no DB migration unless the team later adds a first-class `images[]` column.
- **Pins**: `usePin` / `SelectableBlock` / `PinArticleContextKey` behavior unchanged at API level; UI structure changes so each image is the pinned element.
