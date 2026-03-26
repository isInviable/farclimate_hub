## Why

The bioregion bubble UMAP currently separates hits that share the same bioregion set almost entirely via **deterministic id jitter**, so 2D position is only weakly meaningful. Adding **latitude and longitude** from each search hit makes layout reflect **real geography** as a secondary signal while keeping **bioregions** as the primary multi-hot features—reducing reliance on artificial jitter and aligning the map with user expectations.

## What Changes

- Extend **per-hit UMAP vectors** in `buildPerHitUmapVectors` (or successor) with **two dimensions** derived from `document.location` (lat/lon per existing search payload), **scaled** so coordinates do not overwhelm binary bioregion bits.
- Define explicit behavior for **missing or invalid** coordinates (e.g. null, NaN, or placeholder `0,0` if the API uses that): use a **neutral sentinel** and/or fall back to a **small** jitter so UMAP remains stable.
- **Reduce or remove** the three id-jitter dimensions once location carries separation; keep **minimal** jitter only if needed to break exact ties after geo+bioregion encoding.
- Update **`explorer-umap-bioregion`** spec requirements for the UMAP input vector (no API contract change if `location` is already on hits).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `explorer-umap-bioregion`: **UMAP from per-hit feature vectors** SHALL require bioregion multi-hot **plus** normalized lat/lon where available; jitter SHALL be reduced or optional relative to the pre-change baseline; missing location SHALL be specified.

## Impact

- **Frontend**: `apps/web/app/utils/explorerBioregions.ts`, possibly `ViewModeBioregionUmap.vue` only if tuning UMAP hyperparameters.
- **Data**: Uses existing `document.location` / `location` on search hits (`[lat, lon]` per `SearchResult` types); no new endpoints required.
