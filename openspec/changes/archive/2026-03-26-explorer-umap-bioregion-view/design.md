## Context

Explorer bubble / “by bioRegions” ships as a **UMAP + SVG** view: **per-hit** layout, **per-bioregion** enclosing circles (`smallest-enclosing-circle`), labels, pan, focus-dim, tooltips. `umapProjectsNew` informed patterns (UMAP, D3 scales, SEC) but not 3D cylinders.

## Goals / Non-Goals

**Goals**

- One **dot per hit**; fixed dot radius.
- UMAP on **per-hit** vectors: multi-hot over bioregions in the result set + **deterministic jitter** from `hit.id`.
- Per bioregion: **dashed SEC** around all hits that include that region; **visible label**.
- **Pan**: window-level `pointermove` / `pointerup` while dragging — **no `setPointerCapture` on the SVG** (would steal `click` from circles).
- **Focus**: click bioregion → dim others; click **empty** background (transparent underlay) → clear.
- Document **semantic overlap**: dots may sit inside multiple circles geometrically without extra bioregions in data.

**Non-Goals**

- Real document embeddings from API for this view (v1 uses multi-hot + jitter).
- Size/height encoding of counts on dots or circles in v1.

## Decisions

1. **Hit layout** = UMAP(per-hit multi-hot + jitter); **region rings** = geometry on resulting `(x,y)`.
2. **`<g pointer-events-none">`** with **`pointer-events-auto`** on shapes; transparent full-SVG rect under `g` catches “empty” clicks to clear focus.
3. **`explorerBioregions.ts`**: normalization + `buildPerHitUmapVectors`.

## Risks / Trade-offs

- Overlapping region circles and “single-region hit inside another circle” — documented in spec; tooltip remains source of truth for membership.

## Migration

Shipped behind `viewMode === 'bubble'`. Archive records final spec under `openspec/specs/explorer-umap-bioregion/spec.md`.
