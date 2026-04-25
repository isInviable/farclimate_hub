## 1. Discovery and scaffolding

- [x] 1.1 Confirm `@nuxt/ui` version and whether `Carousel` (or equivalent) is available; if yes, prototype in isolation; if no, plan scroll-snap fallback per `design.md`
- [x] 1.2 Add optional child component (e.g. `ViewModeInstagramCarousel.vue`) under the same folder if it keeps `ViewModeInstagram.vue` readable

## 2. Carousel behavior and data

- [x] 2.1 Replace single hero `<img>` with carousel bound to sorted `document.images` (by `position`), preserving placeholder for empty/missing arrays
- [x] 2.2 Implement dot indicators and navigation for `images.length > 1`; hide redundant chrome for a single image
- [x] 2.3 Keep per-slide `@error` → placeholder behavior without breaking other slides

## 3. Interaction and accessibility

- [x] 3.1 Implement tap vs swipe threshold so horizontal slide changes do not emit `document-selected`; keep “View more…” / caption paths opening the document per spec
- [x] 3.2 Add accessible names / live region (or Nuxt UI defaults) for active slide index; wire any new strings through `en.json` / `es.json`

## 4. Polish and verification

- [x] 4.1 Manually verify multi-image hit, single-image hit, empty images, and broken `public_url` in the Instagram viewmode
- [x] 4.2 Run lint on touched Vue and locale files
