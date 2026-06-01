## 1. Corpus inventory and locale structure

- [x] 1.1 Add script to enumerate unique canonical values per facet category (`climate_impacts`, `adaptation_approaches`, `sectors`, `biogeographical_regions`, `keywords`) from corpus metadata or facets RPC
- [x] 1.2 Add empty `facets.*` namespace skeleton to `en.json`, `es.json`, and `it.json` for all five categories
- [x] 1.3 Run inventory script and populate `en.json` `facets.*` with identity mappings (English value → same English value)
- [x] 1.4 Populate `es.json` and `it.json` `facets.*` translations for controlled vocabularies (climate impacts, adaptation approaches, sectors, bioregions including `no-identificados`)
- [x] 1.5 Populate `es.json` and `it.json` `facets.keywords` from inventory output (translate or stub with English fallback for gaps)

## 2. Shared facet-label lookup

- [x] 2.1 Add `FacetCategory` type and `facetLabel(category, englishValue)` utility using `tm('facets.<category>')` with trim and English fallback
- [x] 2.2 Add `useFacetLabel()` composable wrapping the utility for Vue components
- [x] 2.3 Add unit tests for lookup: translated value, identity in en, missing-key fallback, whitespace trim

## 3. Explorer filter sidebar

- [x] 3.1 Update `SectorFilter`, `HazardsFilter`, `AdaptationApproachesFilter`, and `BiogeographicalRegionsFilter` to set `label` via facet-label lookup and keep `key` as canonical English `e.value`
- [x] 3.2 Fix `BarChartFilter` count/bar lookups to use `item.key` instead of `item.label`
- [x] 3.3 Manual or component test: translated labels render and count bars show non-zero values for known facets

## 4. List view and badges

- [x] 4.1 Update `listMatchBadges.ts` to resolve badge labels through facet-label lookup by kind → category mapping
- [x] 4.2 Update `ViewModeListSimple.vue` sector eyebrow (and any other raw taxonomy display) to use facet-label lookup
- [x] 4.3 Add or update tests for badge label translation and English fallback

## 5. Article summary and other views

- [x] 5.1 Update `ArticleSummaryView.vue` chips (sectors, hazards, adaptation approaches, keywords, bioregion values in geographic section) to use facet-label lookup
- [x] 5.2 Update `SummaryMainContent.vue` keyword chips (and other tag chips if present) to use facet-label lookup
- [x] 5.3 Update `ViewModeBioregionUmap.vue` region labels to use facet-label lookup for `biogeographical_regions`

## 6. Verification

- [x] 6.1 QA in Spanish locale: explorer filter labels translated, applying a filter sends English values in network request, counts correct
- [x] 6.2 QA in Italian locale: article summary keyword and facet chips translated where catalog entries exist
- [x] 6.3 Confirm landing-page sector deep links unchanged (out of scope; no regression)
