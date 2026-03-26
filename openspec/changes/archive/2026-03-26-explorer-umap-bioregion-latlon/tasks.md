## 1. Vector construction (`explorerBioregions.ts`)

- [x] 1.1 Add a helper to read `document.location` as `[lat, lon]`, return `null` when not two finite numbers or when both are `0` (placeholder / no point).
- [x] 1.2 Compute per-batch min–max for valid lat and valid lon over the current `hits` slice; map valid coords to a bounded range (e.g. `[0, 1]`); assign a defined sentinel pair for invalid/missing rows so vector length stays fixed.
- [x] 1.3 Extend `buildPerHitUmapVectors` rows to `[ ...multiHot, scaledLat, scaledLon, (optional ≤1 jitter) ]`; remove or reduce the three `umapJitter01` dimensions per design (prefer ≤1 tie-break only if needed).

## 2. Visualization sanity check

- [x] 2.1 Open bioregion bubble view with a mixed result set (some with map pins, some without); confirm no console errors and layout updates when panning/focus still work.
- [x] 2.2 Optionally nudge `minDist` / `nNeighbors` in `ViewModeBioregionUmap.vue` only if the new vectors produce collapsed or overly stretched layouts.

## 3. Spec sync (on merge / archive)

- [x] 3.1 Apply the delta in `openspec/changes/explorer-umap-bioregion-latlon/specs/explorer-umap-bioregion/spec.md` into `openspec/specs/explorer-umap-bioregion/spec.md` (replace the **UMAP from per-hit feature vectors** requirement block with the MODIFIED text) when implementation is done.
