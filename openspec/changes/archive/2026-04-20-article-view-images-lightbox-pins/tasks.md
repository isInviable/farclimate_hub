## 1. Image URL collection

- [x] 1.1 Add `useDocumentImageUrls` (or equivalent) that returns deduplicated URLs: include `document.image_url` when valid, parse `document.fulltext` for `<img src>`, normalize and order with primary URL first.
- [x] 1.2 Handle SSR/client: avoid heavy work during SSR if needed; document behavior in code comments only if non-obvious.

## 2. Reusable lightbox

- [x] 2.1 Create `AppImageLightbox.vue` (or agreed name) using `UModal` with props for open state, `src`, `alt`, and close affordances (backdrop, Esc, button).
- [x] 2.2 Verify focus behavior and basic keyboard dismissal match Nuxt UI modal patterns.

## 3. Article summary gallery and pins

- [x] 3.1 Refactor `ArticleSummaryView` short-description area: remove static video placeholder; render a grid of images from `useDocumentImageUrls`.
- [x] 3.2 Wrap **each** image in its own `SelectableBlock` with `pin-kind="image"` (or equivalent) containing a single `<img>`; wire thumbnail click to open the lightbox (`@click.stop` so it does not conflict with block selection semantics).
- [x] 3.3 Add empty-state behavior when no URLs are resolved (single placeholder or short message per design).

## 4. i18n and polish

- [x] 4.1 Add locale keys for lightbox close/aria labels if not covered by Nuxt UI defaults.
- [x] 4.2 Manually verify `ArticleViewAI` summary tab: multiple images, lightbox, and two distinct image pins with correct `source_document_uid`.
