## Context

Explorer filtering has moved toward server-backed search with full-match totals, result-set facet counts, and paginated hydration. The current UI still carries older filter concepts (`time`, `phases`, `scales`) and a client-side `filteredPapers` restriction pass that can diverge from the server result set. That divergence is especially risky now that pagination and facet counts are computed from the full server-side matching set.

The database and APIs already expose `adaptation_approaches` as a facet category. The explorer interface does not yet expose it, while `keywords` remains intentionally out of scope because it is a broader taxonomy and would add UI noise.

## Goals / Non-Goals

**Goals:**

- Make the server-backed explorer search result set the only source of truth for which documents render.
- Add Adaptation approaches as a normal facet filter using existing facet and search API support.
- Remove unsupported Time, Phase, and Scale filter leftovers from the explorer filter UI and effective filter signatures.
- Keep explorer totals, visible rows, facet counts, and pagination aligned.
- Preserve existing OR-within-category and AND-across-categories facet semantics.

**Non-Goals:**

- Do not implement a Time filter in this change.
- Do not expose Keywords in the explorer filter UI.
- Do not introduce new normalized Phase or Scale taxonomies.
- Do not change database schema or facet RPC contracts unless implementation discovers a deployed contract mismatch.
- Do not redesign the filter visual component beyond adding the new Adaptation approaches category.

## Decisions

### Server-owned result restriction

The explorer page SHALL render the server-returned page directly instead of applying an additional client-side restriction in `filteredPapers`.

Rationale: server search already computes the matching set used for totals, facets, pagination, and page hydration. A client-side pass only sees the current hydrated page and can hide rows without updating totals or facet metadata.

Alternative considered: keep client-side filtering as a safety net. This was rejected because it preserves mismatched semantics: the server uses exact facet membership from summary arrays, while the client used case-insensitive substring matching for sectors/hazards and unsupported fields for phases/scales.

### Facet filter set

The supported explorer sidebar facet set SHALL be Sector, Climate impacts, Adaptation approaches, and Biogeographical regions.

Rationale: all four categories are backed by `knowledge.summary`, global/result-set facet metadata, and server search request parameters. Time is not a facet array, Phase/Scale are not normalized server-backed fields, and Keywords is deliberately too broad for the current interface.

Alternative considered: implement Time as a range/scalar filter now. This was rejected because it behaves differently from the facet categories and would need a separate design for year parsing, active-count display, and full-match metadata.

### Filter key mapping

The UI MAY keep user-facing names (`sector`, `hazards`) where already established, but the request mapping SHALL translate active filters to server parameter names (`sectors`, `climate_impacts`, `adaptation_approaches`, `biogeographical_regions`) in one place.

Rationale: keeping a single mapping reduces accidental drift and makes saved/effective filter payloads easier to reason about. It also avoids sending inactive or unsupported leftover keys to the search composable.

Alternative considered: rename all UI keys to match backend keys. This would be cleaner long-term but has more saved-search and component churn than needed for this change.

### Unsupported saved filter keys

When loading saved filter state, unsupported keys such as `time`, `phases`, and `scales` SHALL NOT restrict results. The implementation MAY either strip them during load or ignore them during request mapping, but the active UI state should not present them as available filters.

Rationale: old saved payloads should not resurrect dead client-side filtering or make the UI appear to support filters that are no longer available.

Alternative considered: preserve unsupported keys in hidden state. This was rejected because hidden state creates difficult-to-debug result changes and contradicts the server-owned filter model.

## Risks / Trade-offs

- Old saved searches may include `time`, `phases`, or `scales` → Ignore or strip unsupported keys so old data does not affect results.
- Removing client-side filtering may reveal documents previously hidden by substring logic → This is acceptable because server facet membership is the canonical filter behavior; tests should assert visible rows match server hits.
- Adding Adaptation approaches may produce many options → Reuse the existing bar-chart facet component behavior and rely on corpus/result-set counts for ordering and scanability.
- Existing documentation may still describe `/api/search` instead of `/api/explorer-search` for explorer behavior → Update docs/specs to use the explorer search path where relevant while preserving legacy API contracts.
## Context

The explorer page (`apps/web/app/pages/explorer/explorer.vue`) coordinates:

- **FilterManager** — local `filters` / `enabledFilters`, emits `filters-changed`
- **searchStore** — `resultsData`, `searchQuery`, `explorerEffectiveFilters`
- **useHybridSearch** — `facetFilters`, `search()`, `loadAll()` → `POST /api/search`
- **filteredPapers** — client-side filter on `resultsData.hits` using `explorerEffectiveFilters`

The API already ignores empty facet arrays. The UI breaks when (1) `explorerEffectiveFilters` contains an all-false sector map after enable-only, and (2) `filteredPapers` treats that as an active constraint. Separately, `SearchFilter` instantiates its own `useHybridSearch()`, so sidebar Search omits sidebar facet params.

## Goals / Non-Goals

**Goals:**

- Enabling a facet panel without selections: no refetch, no result change, no misleading filter snapshot.
- Refetch when active constraints change (facet checkbox toggles, clearing last selection, disabling a panel that had selections).
- One `runExplorerSearch()` path: sync `facetFilters`, then `hybridSearch(query)` only if search filter enabled and query non-empty, else `loadAll()`.
- View modes display the same rows the API returned for server-filtered facets.
- Sidebar Search includes current facet selections.

**Non-Goals (Phase 2):**

- Saved-search load / Apply-all button alignment (separate follow-up).
- Backend search RPC changes.
- Changing substring badge matching vs API exact facet match (pre-existing; not in scope).

## Decisions

### 1. Constraint diff gates refetch (`FilterManager`)

**Choice:** `FilterManager` updates local UI state on every `filter-change`, but emits `filters-changed` only when derived **active constraints** change (compare normalized `SearchFacetParams` + whether text search is active).

**Rationale:** Single choke point; explorer stays thin.

**Alternative:** Gate only in `explorer.vue` — rejected; FilterManager would still emit on every toggle and couple page to all filter keys.

**Helper:** `activeKeysFromBooleanMap` (shared with `listMatchBadges.ts`) for sector/hazards/bioregions; search active = `enabledFilters.search && searchQuery.trim()`.

### 2. `runExplorerSearch` in explorer (provide/inject)

**Choice:** Implement `runExplorerSearch(effectiveFilters)` in `explorer.vue`; `provide('runExplorerSearch', …)` for `SearchFilter`; remove `useHybridSearch()` from `SearchFilter` (inject `isSearching` from store or parent if needed).

**Rationale:** Explorer already owns `facetFilters` sync; avoids duplicate composable state.

**Alternative:** New `useExplorerSearch.ts` with module-level singleton — acceptable if provide/inject is awkward across FilterManager nesting; prefer provide from page.

### 3. Display: trust API for server facets

**Choice:** Pass `searchStore.resultsData.hits` to view modes for rows already filtered by `POST /api/search`. Keep client-only filtering only for `phases`, `scales`, `time` if still not on API.

**Rationale:** Eliminates double-filter class of bugs; matches network tab.

**Alternative:** Fix `filteredPapers` with `activeKeys` guard only — weaker; leaves duplicate logic.

### 4. Text query when search panel disabled

**Choice:** Keep text in input/store when user disables search panel; exclude from API until panel re-enabled and user runs Search. Disabling after an **active** text search triggers one refetch without `query`.

**Rationale:** Matches agreed default; avoids surprise overwrites while typing with panel off.

### 5. `explorerEffectiveFilters` for badges only

**Choice:** `setExplorerEffectiveFilters` receives payload with **active selections only** (no keys for enable-only empty maps). Badges and list match logic unchanged in spirit.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Stale facet bar counts when enable-only (no refetch) | Expected; counts reflect current result set until user selects |
| URL bootstrap sets query while search panel off | Bootstrap enables search panel + runs search (existing behavior) |
| Saved search load differs until Phase 2 | Document in tasks; Phase 2 change |
| Phases/scales/time still client-only | Apply same “active selection” rule when those gain API support |

## Migration Plan

1. Ship Phase 1 behind manual QA checklist (no feature flag).
2. No DB migration.
3. Rollback: revert frontend commit; specs archive unchanged until re-applied.

## Open Questions

- None blocking Phase 1. Phase 2: whether **Apply filters** remains visible if all panels auto-apply on checkbox change.
