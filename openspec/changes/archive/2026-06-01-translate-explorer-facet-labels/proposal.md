## Why

Explorer filter tags (climate impacts, adaptation approaches, sectors, biogeographical regions, and keywords) are stored as canonical English strings in `knowledge.summary` and shown verbatim in the UI. When the user switches locale to Spanish or Italian, section titles translate but tag values stay in English (GitHub issue #2). This breaks the multilingual experience and leaves partial, unused i18n keys (`hazards.*`, `bioregions.*`) that do not match database values.

## What Changes

- Add a display-layer translation system keyed by **exact English database values** under a new `facets.*` i18n namespace (no slug migration, no database or API contract changes).
- Introduce a shared composable/utility (`useFacetLabel`) used everywhere category tags are rendered: explorer filter sidebar, list match badges, article summary chips (sectors, hazards, adaptation approaches, keywords, bioregions), list row metadata, and bioregion visualizations.
- Generate and populate translation catalogs for all unique facet values per category from the corpus (controlled vocabularies plus keywords).
- Fix `BarChartFilter` count lookups to use canonical English **keys**, not display labels, so translated labels do not break facet count bars.
- Fallback behavior: when no translation exists for a value, display the English canonical string unchanged.
- Landing-page sector deep links (`?sector=Silvicultura` as free-text search) remain **out of scope**; this change covers display of taxonomy values only.

## Capabilities

### New Capabilities

- `facet-label-i18n`: Centralized lookup of user-facing labels for taxonomy values (`climate_impacts`, `adaptation_approaches`, `sectors`, `biogeographical_regions`, `keywords`) by category and exact English value, with English fallback.

### Modified Capabilities

- `explorer-facet-filters`: Filter option labels SHALL be locale-aware; API/filter keys remain English canonical values.
- `explorer-list-match-badges`: Badge labels SHALL use the facet-label i18n layer for active filter dimensions (not raw English keys when a translation exists).

## Impact

- **apps/web**: i18n locale files (`en.json`, `es.json`, `it.json`), new composable/utils, filter components (`SectorFilter`, `HazardsFilter`, `AdaptationApproachesFilter`, `BiogeographicalRegionsFilter`, `BarChartFilter`), `listMatchBadges.ts`, article summary components, list/bioregion view modes.
- **packages/db / API**: No changes — facet RPCs, search payloads, and saved searches continue using English values.
- **Ops**: One-time corpus inventory script to enumerate unique values; translators fill es/it entries (en uses identity mapping).
