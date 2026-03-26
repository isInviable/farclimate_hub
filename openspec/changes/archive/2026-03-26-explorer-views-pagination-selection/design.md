## Context

The explorer page switches between viewmodes that each receive `filteredPapers` from `explorer.vue`. `ViewModeListSimple` already uses `useSearchSelectionStore` for per-row checkboxes and shows a `USelect` for sort that does not affect ordering. `ViewModeGrid` implements select-all via the store but prev/next pagination is disabled with a stub label. Other viewmodes (map, bubble, instagram) may not need the full toolbar; the contract should be opt-in per view.

## Goals / Non-Goals

**Goals:**

- One reusable pattern (composable + optional presentational wrapper) for **page index**, **page size**, **sorted then sliced** items, **total filtered count** surfaced in the toolbar, and **select all / unselect all** for the **current page’s hits**.
- Fix incorrect or non-functional pagination everywhere it is advertised in list/grid.
- Prefer **Nuxt UI** primitives (`UPagination`, `USelectMenu` / `USelect`, `UButton`, `UFormField`) per project rules; consult Nuxt UI MCP or docs for v4 APIs.
- Keep selection store as source of truth; bulk actions map visible hits to `SearchSelectedItem` shape `{ id, title, document }`.

**Non-Goals:**

- Server-side pagination of search results (still client-side slice of `filteredPapers`).
- Persisting page size or sort in user profile (unless trivially added later).
- Changing map/bubble/instagram unless they already duplicate broken pagination (out of scope unless discovered in implementation).

## Decisions

1. **`useExplorerResultsPaging` (or similarly named) composable**  
   - **Inputs**: `Ref<Hit[]>` (or readonly array + watch), default `pageSize`, optional `sortKey` / comparator.  
   - **Outputs**: `page`, `pageSize`, `pageCount`, `totalCount` (length of filtered list after sort, before slice), `pagedItems`, `sortedItems`, setters, and helpers `goPrev` / `goNext` if not using `UPagination`’s v-model alone.  
   - **Rationale**: Avoid duplicating math in each view; views only render `pagedItems` and bind toolbar controls.

2. **`ExplorerResultsToolbar` component (single file)**  
   - **Props**: enable flags (`showPagination`, `showSort`, `showBulkSelect`), sort options, **`totalCount`** (and derived **range on page**, e.g. first–last index) for display, labels via i18n.  
   - **Slots**: default area for view-specific controls (e.g. grid property dropdown) via optional `leading` / `trailing` slots.  
   - **Rationale**: One place for Nuxt UI layout (flex, gaps, responsive wrap) matching grid and list headers.

3. **Select all / unselect all scope = current page only**  
   - **Rationale**: Matches mental model when paginating (user sees N rows); avoids selecting thousands off-screen. Document in UI string if needed (“Select all on this page”).  
   - **Alternative considered**: Select all in full filtered set—rejected for performance and surprise when paging.

4. **Sort**  
   - Implement comparators for options already shown (e.g. title / name, budget if present on `document`). Reset `page` to 1 when sort or result set identity changes.

5. **Grid compare AI cap**  
   - When interpreting “all hits in the grid” for batch summarize, use **rows on the current page** when pagination is on, so cap warnings stay aligned with visible targets.

## Risks / Trade-offs

- **[Risk]** Users expect “select all” to mean entire filtered list → **Mitigation**: label copy clarifies “this page”; optional follow-up for “select all results” behind explicit action.  
- **[Risk]** `UPagination` total/count API differs in Nuxt UI v4 → **Mitigation**: verify against project’s installed `@nuxt/ui` and MCP examples before locking props.  
- **[Risk]** Sort field missing on some documents → **Mitigation**: stable fallback (empty last, or skip sort for that key).

## Migration Plan

- Ship behind no feature flag; behavior change is user-visible fix (pagination works).  
- No database or API migration.

## Open Questions

- Whether `explorer.vue` should own toolbar state for all modes or each viewmode owns composable instance (default: **per viewmode instance** to avoid cross-view leakage when switching tabs).
