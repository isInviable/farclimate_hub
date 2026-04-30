## Context

`human.saved_searches` holds per-project `name` + `filters` (`SavedSearchFilters`). The pinboard shows pins from `human.pins`. This change unifies saved-search **visibility**: the pinboard reads the same table as `SavedSearchMenu` instead of mirroring rows into pins.

## Goals / Non-Goals

**Goals:**

- Pinboard sidebar + grid show the same saved searches as the filter `SavedSearchMenu`.
- **Run search** from the pinboard applies explorer state with parity to `load-search` → `FilterManager`.
- One-shot client handoff (`sessionStorage` + project id) plus optional tick when already on `/explorer/explorer`.

**Non-Goals:**

- Saved search UI on the explorer **floating action bar** (`ActionBarExplorer`) — explicitly excluded; removed from implementation.
- Persisting saved searches as `human.pins` (`body_kind` `saved_search`).
- New SQL tables.

## Decisions

1. **Single source of truth** — `human.saved_searches` only for listing; no pin inserts for saved searches.
2. **Handoff** — `setPendingSavedSearchApply` + `tryConsumePendingSavedSearchApply` in `FilterManager`; `useSavedSearchExplorerApplySignal` when navigation does not remount.
3. **`SavedSearchMenu`** — Supports `variant: full | list-only` for optional reuse; **not** mounted on `ActionBarExplorer` in the shipped product.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Stale list after delete elsewhere | Refetch on project watch; delete from card calls same API as menu. |

## Migration Plan

- Application-only. Optional SQL cleanup of legacy `human.pins` rows with `body_kind = 'saved_search'` if any were created during earlier experiments.

## Open Questions

- None blocking archive.
