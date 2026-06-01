## Context

Taxonomy values (`climate_impacts`, `adaptation_approaches`, `sectors`, `keywords`, `biogeographical_regions`) are extracted from Climate-ADAPT in English and stored in `knowledge.summary` as `TEXT[]` (or derived from JSONB for bioregions). The multilang pipeline translates narrative fields only (`summary_multilang`, `fulltext`, `recipe`); tags remain English canonical values used for facet matching, GIN indexes, and saved searches.

The explorer filter UI receives facet values from `POST /api/facets` and `GET /api/explorer/corpus-metadata` as `{ value: string, count: number }` where `value` is the English canonical string (e.g. `"Droughts"`, `"Nature-based solutions"`). Filter components currently set `label: e.value`, so translated section titles appear alongside English tag values.

Partial i18n keys exist (`hazards.*`, `bioregions.*`, `pills.*`) but are unused in filter components and use camelCase slugs that do not match database strings (`drought` vs `Droughts`).

## Goals / Non-Goals

**Goals:**

- Display locale-appropriate labels for all taxonomy tag values wherever they appear in the explorer UI.
- Keep English canonical values as filter keys and API payloads (no database migration).
- Centralize translation lookup in one composable used across all display surfaces.
- Populate `facets.*` i18n catalogs for en (identity), es, and it from a corpus inventory.
- Fix `BarChartFilter` to resolve counts by canonical key, not display label.

**Non-Goals:**

- Translating tags in the database or pipeline ingest.
- Changing landing-page sector deep links (`?sector=` as free-text hybrid search).
- Translating geographic proper nouns (countries, cities) unless they appear as facet category values.
- Removing legacy `hazards.*` / `bioregions.*` keys in this change (deprecate by disuse; new code uses `facets.*` only).

## Decisions

### 1. Full English strings as i18n keys (not slugs)

**Choice:** Nest translations under `facets.<category>` with JSON object keys equal to exact English database values.

**Rationale:** Slugs would require a mapping layer or DB rewrite. Full-string keys preserve 1:1 correspondence with facet API `value` fields and saved-search payloads.

**Lookup:**

```ts
type FacetCategory =
  | 'climate_impacts'
  | 'adaptation_approaches'
  | 'sectors'
  | 'biogeographical_regions'
  | 'keywords'

function facetLabel(category: FacetCategory, englishValue: string): string {
  const map = tm(`facets.${category}`) as Record<string, string> | undefined
  const trimmed = englishValue.trim()
  return map?.[trimmed] ?? trimmed
}
```

**Alternative considered:** Normalized slugs (`droughts`) with a TS mapping file — rejected due to maintenance overhead and mismatch with existing DB/API contract.

### 2. Shared composable: `useFacetLabel()`

**Choice:** Export `facetLabel(category, value)` and `useFacetLabel()` from `apps/web/app/composables/useFacetLabel.ts` (or `utils/facetLabel.ts` + thin composable wrapper).

**Rationale:** Single source of truth; filter components, badges, and article summaries all call the same function. Category parameter disambiguates collisions (e.g. a keyword vs sector with similar text).

### 3. Filter items: `{ key, label }` separation

**Choice:** Filter components map facet entries to `{ key: e.value, label: facetLabel(category, e.value) }`. Selection state and API params use `key`; UI renders `label`.

**Rationale:** `BarChartFilter` currently looks up counts via `item.label`. This MUST change to `item.key` so translated labels do not zero out count bars.

### 4. Corpus inventory script

**Choice:** Add a script under `apps/web/scripts/` (or `packages/db/scripts/`) that queries unique values per category (via facets RPC, corpus metadata, or direct SQL) and outputs JSON skeletons for locale files.

**Rationale:** Keywords alone are hundreds of values; manual enumeration is error-prone. Script generates complete key sets; translators fill es/it.

### 5. English locale uses identity mapping

**Choice:** `en.json` `facets.*` entries map each English value to itself.

**Rationale:** Makes missing-key detection symmetric across locales; `te()` checks work uniformly.

### 6. Fallback: English canonical value

**Choice:** If no translation exists, return the trimmed English input unchanged. No user-visible error.

### 7. Display surfaces in v1

Wire `useFacetLabel` in:

| Surface | Categories |
|---------|------------|
| `SectorFilter`, `HazardsFilter`, `AdaptationApproachesFilter`, `BiogeographicalRegionsFilter` | respective facet category |
| `BarChartFilter` | count lookup by key only |
| `listMatchBadges.ts` | sector, hazard, adaptation, bioregion |
| `ArticleSummaryView.vue` | sectors, hazards, adaptation approaches, keywords, bioregion chips in geo section |
| `SummaryMainContent.vue` | keywords (and other tags if rendered) |
| `ViewModeListSimple.vue` | sector eyebrow, badge labels |
| `ViewModeBioregionUmap.vue` | region labels on chart |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Large keywords catalog bloating locale JSON | Generate from inventory; consider splitting `facets.keywords` into a separate lazy-loaded locale file if bundle size becomes an issue |
| New corpus values added after deploy show English until translated | Acceptable per fallback policy; re-run inventory script after data pushes |
| Special characters in JSON keys (quotes, commas) | Use standard JSON string escaping; lookup by exact value from API, not constructed paths with dots |
| Legacy `hazards.*` / `bioregions.*` confusion | Document in design; new code uses `facets.*` only |
| Translator workload for ~hundreds of keywords | Prioritize controlled vocabularies first in tasks; keywords can follow in same PR with generated stubs |

## Migration Plan

1. Add composable and empty `facets.*` structure to locale files.
2. Run inventory script; populate en/es/it entries.
3. Wire display surfaces; fix BarChartFilter count lookup.
4. Manual QA: switch locale es/it, verify filter labels, counts, apply filter (API still sends English), article summary chips, list badges.
5. No rollback beyond reverting the frontend PR; no data migration.

## Open Questions

- None blocking v1. Landing sector deep-link behavior remains a separate future change if product wants facet-filter semantics instead of free-text search.
