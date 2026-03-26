## Why

The explorer’s “by bioRegions” view was a placeholder. Shipped behavior: **UMAP** lays out **one dot per filtered hit** from per-hit multi-hot bioregion vectors (+ id jitter); **each bioregion** gets a **dashed enclosing circle** and **always-visible label**. Users can **pan**, **focus** a bioregion (dim the rest), and use **tooltips** (hit: title + bioregion list; region: name + count). **Overlapping circles** are expected and do not override data-derived bioregion membership.

## What Changes

- `ViewModeBioregionUmap.vue` (+ `explorerBioregions.ts`) wired from `explorer.vue` bubble mode.
- No backend or search API contract change; uses `geographic_characterisation.biogeographical_regions` and **`no-identificados`** per facet rules.

## Capabilities

### New Capabilities

- `explorer-umap-bioregion`: Normative spec at `openspec/specs/explorer-umap-bioregion/spec.md`.

### Modified Capabilities

- _(none)._

## Impact

- **Frontend** only: `apps/web/app/components/explorer/wf/viewmodes/ViewModeBioregionUmap.vue`, `apps/web/app/utils/explorerBioregions.ts`, `apps/web/app/pages/explorer/explorer.vue`.
- **Dependencies**: `umap-js`, `d3`, `@vueuse/core`, `smallest-enclosing-circle`.
