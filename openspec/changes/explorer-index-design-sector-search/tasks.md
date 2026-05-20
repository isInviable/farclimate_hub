## 1. Shared helpers and tokens

- [x] 1.1 Audit `index.vue` and `explorer.vue` for duplicated class bundles; add `@layer components` utilities in `apps/web/app/assets/css/main.css` or Nuxt UI defaults in `apps/web/app/app.config.ts` for repeated surfaces (cards, mono labels).
- [x] 1.2 Add helper or composable that maps raw `sector` query to store text: trim, treat reserved `all` as empty (`null`), otherwise return the decoded string unchanged for `searchStore.searchQuery`.

## 2. Explorer landing page

- [x] 2.1 Restyle `apps/web/app/pages/explorer/index.vue` to use neutral / warm-neutral tokens and Nuxt UI (`UCard`, `UButton`, `UInput`) consistent with `explorer.vue`; remove legacy `gray-*` where replaced.
- [x] 2.2 Extract sector grid, intro block, and search strip into focused components under `apps/web/app/components/explorer/` (or `explorer/landing/`).
- [x] 2.3 Replace hard-coded English with i18n keys (e.g. `explorer.index.*`) in every active locale file under `apps/web/i18n/locales/`.
- [x] 2.4 Align landing navigation URLs with explorer behavior: ensure free-text uses `query` (and optionally keep `type` compatibility); `sector=` values MUST match strings users would type (passthrough—no hidden relabeling).

## 3. Explorer URL bootstrap

- [x] 3.1 Refactor `onMounted` initialization in `apps/web/app/pages/explorer/explorer.vue` to apply precedence: explicit `query` / `type` → literal `sector` text → `loadAll`; handle `sector=all` as empty query.
- [x] 3.2 Add `watch` on relevant `route.query` keys so client-side navigation from the landing page updates `searchStore.searchQuery` and re-runs `hybridSearch` or `loadAll`.
- [x] 3.3 Confirm `FilterManager` / `SearchFilter` uses `searchStore.searchQuery` (or equivalent) so the search box shows URL-seeded text on load and after route updates.
- [x] 3.4 Document precedence in a short code comment next to the initializer; confirm facets are not auto-toggled by sector bootstrap.

## 4. Verification

- [x] 4.1 Manual smoke: `?sector=` with several strings (including spaces/encoding), `sector=all`, and bookmarks with `?query=` / `?type=`; confirm search input matches store text.
- [x] 4.2 Switch locale and confirm translated landing strings; run linter on touched Vue/CSS files.
