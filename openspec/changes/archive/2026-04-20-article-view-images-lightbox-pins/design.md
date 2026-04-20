## Context

`ArticleSummaryView` renders the short-description `SelectableBlock` with one `<img>` bound to `document.image_url` and a second static `video_placeholder.png`, which reads as a broken or empty video tile. `ArticleViewAI` provides `PinArticleContextKey` so pins get `source_document_uid`; `SelectableBlock` + `usePin` already support `pinKind="image"` and persist `IMG` `src`/`alt` in `body.data`. The gap is UI: enumerate all images, remove misleading placeholders, add lightbox, and wrap each image in its own pin scope.

## Goals / Non-Goals

**Goals:**

- Derive a **deduplicated ordered list** of image URLs for a document: always include `image_url` when set; **add** URLs discovered in `document.fulltext` HTML (`<img src>`) when present; ignore invalid or duplicate URLs.
- Render **all** such images in the summary (responsive grid or horizontal wrap), each thumbnail clickable.
- **Reusable lightbox** component: opens on thumbnail click, shows image at large size (`object-contain`), closes via backdrop click, close button, and Escape; trap focus and use `UModal` (Nuxt UI) or an accessible fullscreen pattern consistent with project conventions.
- **One pin control per image**: each image lives inside its own `SelectableBlock` (or a thin wrapper that preserves the same pin semantics with `pin-kind="image"`) so `handlePin` targets that `<img>` and inherits article context from `ArticleViewAI`.

**Non-Goals:**

- Server-side image ingestion, new DB columns, or copying blobs into `human-pin-images` (existing **Image pins prefer server-orchestrated storage** requirement remains long-term; this change is client-side gallery + pin capture only).
- Video playback in the summary unless a real video URL exists on the document (out of scope unless product adds a field).

## Decisions

1. **Lightbox implementation** — Prefer **`UModal`** with `:ui` sizing for fullscreen feel and built-in focus management, wrapped in e.g. `AppImageLightbox.vue` with props `modelValue`, `src`, `alt`, and emit `update:modelValue`. Alternatives: custom fixed overlay (more code, duplicate a11y); third-party library (rejected: extra dependency).

2. **Where to collect URLs** — Add a small composable `useDocumentImageUrls(document)` (or pure helper in `utils/`) that returns `string[]`: push `image_url` if valid HTTP(S), run a DOMParser (client-only) or regex on `fulltext` for `src` attributes, normalize, dedupe. **Rationale:** DB still exposes only `image_url`; many articles store extra figures in HTML.

3. **Layout** — Replace the single flex row with a **grid** (`grid-cols-2 sm:grid-cols-3` or similar) of `SelectableBlock`s, each with a single `<img>` + lightbox open on image click (`@click.stop` on the image so block selection vs pin remains clear—pin button stays top-right per `SelectableBlock`). **Rationale:** matches “pin around each image” and avoids one block pinning the whole gallery.

4. **Empty state** — If the list is empty after normalization, show one placeholder image (existing `img_placeholder`) inside one block or a short message; no fake video tile.

## Risks / Trade-offs

- **[Risk] Parsing HTML in SSR** — `fulltext` may be large; parsing on server could be costly. **Mitigation:** run extraction in `onMounted` or only on client for the composable, or cache per document id in a shallow ref.
- **[Risk] Duplicate images** — Same URL in `image_url` and body. **Mitigation:** dedupe by normalized URL string.
- **[Risk] External `src` in pins** — Image pins still store remote URLs in `body.data` until server copy flow exists. **Mitigation:** acceptable MVP per existing human-pin-storage direction; no change to storage in this design.

## Migration Plan

Deploy as a normal frontend release; no migrations. Rollback by reverting the Vue components.

## Open Questions

- Whether product wants **captions** from `alt` or nearby figure text in a later iteration (not required for MVP).
- Whether **structured** tab should reuse the same gallery component for consistency (optional follow-up).
