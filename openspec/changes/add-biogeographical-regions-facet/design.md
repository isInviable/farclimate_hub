# Design: Biogeographical regions facet

## Context

- `knowledge.summary` has `geographic_characterisation JSONB`; inside it, `biogeographical_regions` is the EU biogeographical region(s) for the document. In source data it appears as a string (e.g. `"Atlantic"`, `"Alpine, Pannonian"`) or null; it is not yet exposed as a filterable facet.
- Existing facets (sectors, climate_impacts, adaptation_approaches, keywords) use dedicated `TEXT[]` columns, GIN indexes, `knowledge.get_filter_facets`, `knowledge.get_summary_facet_arrays`, and frontend BarChartFilter-style components. Search applies AND across categories and OR within each.

## Goals / Non-Goals

**Goals:**

- Add `biogeographical_regions` as a fifth facet with the same behaviour as the existing four: global and for_result_set counts, filter in search (AND with other facets, OR within regions).
- Reuse existing filter UI pattern (BarChartFilter) so the new filter looks and behaves like Sector / Hazards.
- Derive facet and filter values from the existing `geographic_characterisation` JSONB in SQL (no new column). Documents with null or empty region data SHALL appear as **"no-identificados"** in the facet list and be filterable by that value.

**Non-Goals:**

- Changing how other facets work; changing the explorer layout beyond adding one more filter.
- Supporting other fields inside `geographic_characterisation` (e.g. countries, sub_nationals) as facets in this change.

## Decisions

### 1. No new column; derive from `geographic_characterisation` JSONB

- **Choice**: Do not add a `biogeographical_regions` column. Keep the single source of truth in `geographic_characterisation` and derive the facet list and per-document array in the facet functions and in `get_summary_facet_arrays` using SQL.
- **Rationale**: We are fine with JSONB in the DB; duplicating into a dedicated column adds migration, backfill, and push logic without a strong need (facet aggregation over the table is acceptable from JSONB). Normalization (string vs array, comma split) is done once per query in the facet RPCs.
- **Implementation**: In SQL, normalize `geographic_characterisation->'biogeographical_regions'` (string → split by comma and trim; array → `jsonb_array_elements_text`; null/missing → treat as "no-identificados"). For `get_summary_facet_arrays`, return a computed TEXT[] per document: either the normalized list of regions or `ARRAY['no-identificados']` when null/empty.

### 2. "no-identificados" for null/empty

- **Choice**: When `biogeographical_regions` could not be extracted (null or missing), the document SHALL count under the facet value **"no-identificados"** and SHALL be included when the user filters by "no-identificados".
- **Rationale**: Null means “information could not be extracted from source”; users should see how many such documents exist and be able to filter to them explicitly.

### 3. Frontend: new component reusing BarChartFilter

- **Choice**: Add a component (e.g. `BiogeographicalRegionsFilter.vue`) that, like `SectorFilter.vue` and `HazardsFilter.vue`, wraps `BarChartFilter` with props for `global.biogeographical_regions` and `for_result_set.biogeographical_regions`, and emits with a stable filter key (e.g. `biogeographical_regions`).
- **Rationale**: Same UX as other category filters; minimal new code; FilterManager and explorer already know how to pass facet data and apply filters.

### 5. Filter key and API field name

- **Choice**: Use `biogeographical_regions` everywhere (API body, types, filter key in FilterManager).
- **Rationale**: Matches DB and backend naming; avoids extra mapping.

## Risks / Trade-offs

- **Risk**: Source data inconsistency (e.g. "Atlantic" vs "atlantic"). **Mitigation**: Normalize in SQL (trim); display as stored. Optional: canonical list later.
- **Trade-off**: Facet aggregation reads from JSONB each time; for very large tables a dedicated column + GIN index could be added later if needed.
- **Trade-off**: We do not add a canonical list of EU regions; any value present in the data (plus "no-identificados") becomes a facet value.

## Migration Plan

1. **SQL only**: Update `knowledge.get_filter_facets` and `knowledge.get_summary_facet_arrays` to derive `biogeographical_regions` from `geographic_characterisation` (normalize in SQL; null/empty → "no-identificados"). No new columns or migrations.
2. **Public API**: Ensure public wrappers return the new field.
3. **Backend (Nuxt)**: Extend `POST /api/facets` response type and `POST /api/search` body to include `biogeographical_regions`; in search, include it in facet filter logic and in the row type passed to `filterIdsByFacets` (handling "no-identificados" when filtering).
4. **Frontend**: Add types, `useHybridSearch`, filter component, and FilterManager wiring. Show "no-identificados" in the region list like any other option.
5. **Rollback**: Revert SQL functions and API/frontend changes only.

## Open Questions

- None; normalization rules (comma split, trim) are sufficient for current data.
