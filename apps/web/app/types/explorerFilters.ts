/**
 * Effective explorer filter payload from `FilterManager` (`getEffectiveFilters()`).
 * Must stay JSON-serializable (plain objects, arrays, primitives) for saved searches (`SavedSearchFilters.filters`).
 */
export type ExplorerEffectiveFilters = Record<string, unknown>
