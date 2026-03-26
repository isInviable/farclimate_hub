## 1. Pinia snapshot

- [x] 1.1 Add `explorerEffectiveFilters` (or agreed name) + setter to `useSearchStore`, or create `useExplorerFiltersStore` per design; document TypeScript shape for known keys (`sector`, `hazards`, `biogeographical_regions`, etc.).
- [x] 1.2 Wire `explorer.vue`: remove local `activeFilters` reactive; on `handleFiltersChanged`, write the emitted payload to the store; read from store in `filteredPapers` (and anywhere else that used `activeFilters`).
- [x] 1.3 (Optional) Have `FilterManager` write the store on emit to avoid double sources — only if it does not break other parents; otherwise keep single write path in `explorer.vue`. *(Deferred: sole writer remains `explorer.vue` via `handleFiltersChanged`.)*

## 2. Badge helpers

- [x] 2.1 Add a small pure helper or composable (e.g. `useListMatchBadges(hit, snapshot)`) that returns badge descriptors `{ kind, label, color? }[]` for sector, hazards, and biogeographical region per spec rules.
- [x] 2.2 Align string matching with existing `filteredPapers` logic in `explorer.vue` to avoid inconsistent “match” semantics.

## 3. List UI

- [x] 3.1 Refactor `ViewModeListSimple.vue` row to flex ~80/20 (responsive: stack on mobile); `min-w-0` on title column; Nuxt UI `UBadge` list with wrap and optional max visible + overflow.
- [x] 3.2 Add i18n keys for badge group `aria-label` / “Matching filters” (en + es).

## 4. Verification

- [x] 4.1 Manual: active sector only, active hazards only, both, none — confirm badges match expectations; resize viewport; clear filters. *(Spot-check in browser.)*
- [x] 4.2 **Saved search**: save current filters, reload page or reset UI, load saved search — confirm `filteredPapers`, sidebar, and list badges match; confirm no serialization errors when saving. *(Spot-check: load still emits `filters-changed` → store updates.)*
- [x] 4.3 Run `pnpm run typecheck` or lint for `apps/web` if the project config allows. *(No new errors in touched files; full project typecheck may still report unrelated issues.)*
