import type { SavedSearchFilters } from "~/types/savedSearches";
import {
  stripUnsupportedExplorerFilters,
  UNSUPPORTED_EXPLORER_FILTER_KEYS,
} from "~/utils/explorerFacetFilters";

function isSupportedFilterKey(key: string): boolean {
  return !UNSUPPORTED_EXPLORER_FILTER_KEYS.includes(
    key as (typeof UNSUPPORTED_EXPLORER_FILTER_KEYS)[number]
  );
}

/**
 * Mutates filter/search UI state to match a saved search (same behaviour as
 * `SavedSearchMenu` → `load-search` → `FilterManager.handleLoadSavedSearch`).
 * Returns the effective filters object for `filters-changed` emit.
 */
export function applySavedSearchFiltersState(
  state: SavedSearchFilters,
  ctx: {
    filters: Record<string, unknown>
    enabledFilters: Record<string, boolean>
    setSearchQuery: (q: string) => void
  }
): Record<string, unknown> {
  Object.keys(ctx.filters).forEach((k) => {
    delete ctx.filters[k];
  });
  Object.keys(ctx.enabledFilters).forEach((k) => {
    delete ctx.enabledFilters[k];
  });

  if (state.filters) {
    Object.entries(state.filters).forEach(([k, v]) => {
      if (isSupportedFilterKey(k)) ctx.filters[k] = v;
    });
  }
  if (state.enabledFilters) {
    Object.entries(state.enabledFilters).forEach(([k, v]) => {
      if (isSupportedFilterKey(k)) ctx.enabledFilters[k] = v;
    });
  }
  if (state.searchQuery !== undefined) {
    ctx.setSearchQuery(state.searchQuery);
    if (state.searchQuery.trim()) {
      ctx.filters.search = state.searchQuery;
      ctx.enabledFilters.search = true;
    }
  }

  const effective = Object.fromEntries(
    Object.entries(ctx.filters).filter(([k]) => ctx.enabledFilters[k])
  );
  return stripUnsupportedExplorerFilters(effective);
}
