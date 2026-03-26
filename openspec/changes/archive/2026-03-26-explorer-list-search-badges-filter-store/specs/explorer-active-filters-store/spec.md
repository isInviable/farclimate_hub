# Explorer active filters (Pinia)

Central snapshot of effective explorer sidebar filter state for use across the explorer page and result views.

## ADDED Requirements

### Requirement: Pinia snapshot of effective UI filters

The application SHALL persist the **effective** explorer filter payload (equivalent to filters that are both enabled and applied in `FilterManager`, i.e. today’s `getEffectiveFilters()` shape) in **Pinia** so any explorer consumer can read it without a duplicate `reactive` copy living only in `explorer.vue`.

#### Scenario: User toggles sector filter

- **WHEN** the user changes sector selection and `FilterManager` emits updated effective filters
- **THEN** the Pinia snapshot SHALL update to match that payload before or when the explorer applies client-side filtering and search refetch logic

#### Scenario: List view reads filters

- **WHEN** `ViewModeListSimple` (or another view) needs active filter keys for badges
- **THEN** it SHALL read from the same Pinia snapshot (or a composable that wraps it) without requiring new props from `explorer.vue` solely for that purpose

### Requirement: Single writer contract

Either `explorer.vue` SHALL subscribe to `filters-changed` and write the snapshot **or** `FilterManager` SHALL write the snapshot when emitting; the implementation SHALL avoid two competing writers that overwrite each other inconsistently.

#### Scenario: Clear all filters

- **WHEN** the user clears all filters
- **THEN** the snapshot SHALL reflect an empty effective set (or documented default) consistent with `getEffectiveFilters()` after clear

### Requirement: Type-safe or documented shape

The snapshot type SHALL be documented (TypeScript interface or inline JSDoc) covering at least keys used for badges and filtering: `sector`, `hazards`, `biogeographical_regions`, and other keys `FilterManager` may emit when enabled.

#### Scenario: Unknown keys

- **WHEN** a new filter key is added to `FilterManager` in the future
- **THEN** consumers SHALL tolerate unknown entries without runtime errors (e.g. optional access)

### Requirement: Serializable state and saved-search compatibility

Values held in the Pinia snapshot (and any derived state written from the same filter pipeline) SHALL be **JSON-serializable**: plain objects, arrays, strings, numbers, booleans, and `null` only — no functions, `Map`/`Set`, class instances, or circular references in that payload.

The existing **saved searches** feature SHALL remain fully supported. Persisted payloads SHALL continue to match the `SavedSearchFilters` shape (`searchQuery`, `enabledFilters`, `filters`). Loading a saved search SHALL restore sidebar filter state and SHALL update the Pinia explorer snapshot (via the same `filters-changed` / `handleLoadSavedSearch` flow or equivalent) so client-side filtering and list badges reflect the loaded search without requiring a full page reload.

#### Scenario: Round-trip save and load

- **WHEN** a user saves the current explorer filters and later loads that saved search
- **THEN** the restored UI state SHALL match the saved definition and the Pinia snapshot SHALL be consistent with the effective filters after load

#### Scenario: JSON persistence

- **WHEN** the client persists filter state for saved searches (e.g. `JSON.stringify` to API or local storage)
- **THEN** the stored `filters` and related fields SHALL not fail serialization due to non-JSON values introduced by the new store
