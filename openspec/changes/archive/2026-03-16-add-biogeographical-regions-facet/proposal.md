# Add biogeographical regions facet

## Why

Documents have a `summary.geographic_characterisation` JSONB field that includes `biogeographical_regions` (EU biogeographical regions). Users need to filter the explorer by these regions in the same way they filter by Sector or Climate impacts, so they can narrow results to Atlantic, Continental, Mediterranean, Alpine, etc., and see which regions are available and how many documents match.

## What Changes

- **Database**: No new column. Biogeographical regions are derived from the existing `geographic_characterisation` JSONB in the facet and search logic. Documents where the value could not be extracted (null or missing) SHALL appear under a single facet option **"no-identificados"** so users can filter by “region not identified”.
- **Backend**: Extend the filter facets API and search API to include `biogeographical_regions` (global + for_result_set counts, and filter-by-region in search). Facet list SHALL include "no-identificados" with the count of documents that have null/empty region data.
- **Frontend**: Add a new filter of the same type as Sector/Hazards (BarChartFilter), showing available regions and counts (including "no-identificados"), and send selected regions when the filter is active.

No breaking changes: new optional field and new filter; existing facets and filters unchanged.

## Capabilities

### New Capabilities

- `biogeographical-regions-facet`: Backend and DB support for faceting and filtering by `summary.geographic_characterisation.biogeographical_regions` (array derivation, facet function, search filter). Single spec covering DB + API contract.

### Modified Capabilities

- `filter-facets`: Extend to include a fifth category `biogeographical_regions` with the same shape (list of `{ value, count }`) in global and for_result_set.
- `explorer-facet-filters`: Add a Biogeographical regions filter component driven by facets API (`global.biogeographical_regions` / `for_result_set.biogeographical_regions`), same behaviour as Sector and Hazards (only active filters sent, apply triggers search with facet params).

## Impact

- **DB**: No schema change. `get_filter_facets` and `get_summary_facet_arrays` are extended to derive `biogeographical_regions` from `geographic_characterisation` JSONB (normalize string/array in SQL; null/empty → "no-identificados").
- **Ingestion**: No change; `geographic_characterisation` remains the single source of truth.
- **API**: `POST /api/facets` response and `POST /api/search` request/body types include `biogeographical_regions`.
- **Frontend**: New filter component (or reuse BarChartFilter with new key), FilterManager and explorer page wire it; `useHybridSearch` and search store pass the new facet param.
