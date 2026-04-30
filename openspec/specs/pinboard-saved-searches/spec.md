# pinboard-saved-searches Specification

## Purpose

Saved searches for a project live in `human.saved_searches`. The pinboard SHALL show the **same** list as the explorer filter `SavedSearchMenu` (same fetch and project scope), without persisting saved searches as `human.pins`. The explorer floating action bar SHALL NOT duplicate saved-search UI.

## Requirements

### Requirement: Pinboard loads saved searches from human.saved_searches

The pinboard view (`PinBoardView` or successor) SHALL fetch saved searches for the active project using the same Supabase access path as `SavedSearchMenu` (`useSavedSearchesSupabase` / `human.saved_searches`). The list SHALL refresh when the active project changes.

#### Scenario: Authenticated owner sees saved searches on the board

- **WHEN** an authenticated user opens the project pinboard with a non-empty `human.saved_searches` set for that project
- **THEN** the UI SHALL render a **Saved searches** sidebar entry with a correct count and SHALL show each saved search by its `name`

### Requirement: Saved searches appear under All and in a dedicated sidebar filter

The pinboard SHALL show saved searches in a dedicated grid section when **All** is selected, and SHALL offer a sidebar category that lists only saved searches when that category is selected. Pin sections by `body_kind` SHALL remain driven by `human.pins` only.

#### Scenario: All includes a saved-searches block above pin sections

- **WHEN** the user selects **All** in the pinboard sidebar and at least one saved search exists
- **THEN** the grid SHALL show a **Saved searches** section (with count) above pin-kind sections

### Requirement: Run saved search from pinboard matches filter menu behaviour

Each saved-search card on the pinboard SHALL offer a primary control (e.g. **Run search**) that applies the saved `filters` payload in the explorer with the same outcome as choosing that row inside `SavedSearchMenu` on the filter sidebar (search query, enabled filters, values, and downstream refresh). The implementation MAY use a one-shot client handoff (e.g. `sessionStorage` plus navigation or in-page apply signal) as long as the observable explorer state matches.

#### Scenario: Run search from pinboard

- **WHEN** an authenticated project owner activates **Run search** on a saved-search card on the pinboard
- **THEN** the explorer SHALL apply that saved search’s filter state for the same project

### Requirement: Delete saved search from pinboard

The pinboard saved-search card SHALL allow deleting the corresponding `human.saved_searches` row for authenticated owners, using the same delete path as the filter menu. After deletion, the card SHALL disappear from the pinboard on refresh.

#### Scenario: Delete from pinboard card

- **WHEN** the user activates delete on a saved-search card
- **THEN** the row SHALL be removed from `human.saved_searches` and the pinboard list SHALL update

### Requirement: Explorer floating action bar does not expose saved searches

The explorer floating action bar (`ActionBarExplorer` wrapping `ActionBarBase` for bottom results actions) SHALL NOT include saved-search UI: no `SavedSearchMenu`, no saved-search-only popover, and no extra buttons whose sole purpose is listing or saving searches. Saved searches SHALL remain reachable from the **filter sidebar** `SavedSearchMenu` and from the **pinboard** only.

#### Scenario: Action bar has no saved-search entry point

- **WHEN** a user views the explorer results page with the floating action bar visible
- **THEN** the action bar SHALL NOT render `SavedSearchMenu` or an equivalent duplicate saved-search picker
