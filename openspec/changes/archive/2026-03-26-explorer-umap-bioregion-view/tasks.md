## 1. Data helpers

- [x] 1.1 Add a small helper or composable (e.g. `useBioregionsFromHits` or `utils/bioregionsFromGeographicCharacterisation.ts`) that maps a hit’s `document.geographic_characterisation` to `string[]` with comma-split, array handling, and `no-identificados` fallback (mirror `ArticleSummaryView` / facet semantics).
- [x] 1.2 From `filteredPapers` (or equivalent explorer hit list), build per-region **document counts** and a **region × region co-occurrence** matrix (for each document, increment co-occurrence for every unordered pair of its regions, including diagonal as count).

## 2. UMAP visualization component

- [x] 2.1 Create `ViewModeBioregionUmap.vue` (or agreed name) under `apps/web/app/components/explorer/`, using `umap-js`, `d3`, and `useElementSize`; follow `umapProjectsNew.vue` only for **UMAP + scales + tooltips**, not cylinders or extruded height.
- [x] 2.2 Run UMAP on region feature vectors (rows of co-occurrence); handle `< 2` regions with a non-error fallback layout (e.g. single centered dot).
- [x] 2.3 Map UMAP output to SVG with padding and optional **2D collision nudging** so uniform circles do not overlap; use a **single fixed radius** for every region marker (no `scaleZ`, no radius tied to count).
- [x] 2.4 Implement hover tooltips (region label + hit count); optionally emit `document-selected` with a representative hit per region. **Defer** encoding extra variables (size, color channels for metrics, 3D) to a follow-up task.

## 3. Explorer integration

- [x] 3.1 Replace the `viewMode === 'bubble'` `TBD` block in `apps/web/app/pages/explorer/explorer.vue` with the new component, passing the filtered hit list.
- [x] 3.2 Add empty-state UI when there are zero filtered hits (Nuxt UI–consistent).

## 4. Verification

- [x] 4.1 Manually verify: non-empty search → bubble tab shows layout; multi-region documents affect counts/co-occurrence; missing geo → `no-identificados`; empty results → empty state, no console errors; all region dots share the same radius.
- [x] 4.2 Run the web app lint/typecheck for touched files (`pnpm` in `apps/web` as per repo convention).
