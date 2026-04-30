### Requirement: Database table for saved searches
The system SHALL provide a `human.saved_searches` table with columns `id` (uuid PK), `project_id` (uuid FK to `human.projects`), `name` (text, not null), `filters` (jsonb, not null), `created_at` (timestamptz), and `updated_at` (timestamptz). The table SHALL cascade-delete when the parent project is deleted.

#### Scenario: Table exists after migration
- **WHEN** the migration SQL `06_saved_searches.sql` is executed
- **THEN** the table `human.saved_searches` exists in the `human` schema with all specified columns and constraints

#### Scenario: Cascade delete on project removal
- **WHEN** a project is deleted from `human.projects`
- **THEN** all rows in `human.saved_searches` referencing that project SHALL be deleted automatically

---

### Requirement: RLS policies restrict access to owner
Row Level Security SHALL be enabled on `human.saved_searches`. Authenticated users SHALL only be able to SELECT, INSERT, UPDATE, and DELETE rows where the parent `project_id` belongs to a project they own (`human.projects.owner_user_id = auth.uid()`). Unauthenticated (anon) users SHALL have no access.

#### Scenario: Authenticated user reads own saved searches
- **WHEN** an authenticated user queries `human.saved_searches` for a project they own
- **THEN** the system returns only saved searches belonging to that project

#### Scenario: Authenticated user cannot read others' saved searches
- **WHEN** an authenticated user queries `human.saved_searches` for a project they do not own
- **THEN** the system returns zero rows

#### Scenario: Anon user has no access
- **WHEN** an unauthenticated request queries `human.saved_searches`
- **THEN** the system returns zero rows or an authorization error

---

### Requirement: Create a saved search
An authenticated user SHALL be able to create a saved search by providing a `name` and the current search state as a JSONB object (`filters`), scoped to the active project. The `filters` JSONB object SHALL contain at minimum `searchQuery` (string), `enabledFilters` (object mapping filter keys to booleans), and `filters` (object mapping filter keys to their values).

#### Scenario: Save current search state
- **WHEN** an authenticated user clicks "Save current search" in the SavedSearchMenu and provides a name
- **THEN** a new row is inserted into `human.saved_searches` with the given name, the serialised filter state, and the current project's ID
- **AND** the new saved search appears in the dropdown list

#### Scenario: Demo user cannot save
- **WHEN** a demo (unauthenticated) user attempts to save a search
- **THEN** the system redirects to login via `requireAuthForPersistence()`

---

### Requirement: List saved searches for a project
The system SHALL display all saved searches belonging to the current project in a dropdown menu accessible via a three-dot icon next to the "Active Filters" heading. Each entry SHALL show its name.

#### Scenario: Dropdown lists saved searches
- **WHEN** an authenticated user opens the three-dot menu in the filter sidebar
- **THEN** the dropdown displays all saved searches for the current project, ordered by most recently updated first

#### Scenario: Empty state
- **WHEN** there are no saved searches for the current project
- **THEN** the dropdown displays a "No saved searches" message and the "Save current search" action

---

### Requirement: Load a saved search
When a user selects a saved search from the dropdown, the system SHALL deserialise its `filters` JSONB and restore the `FilterManager` and `useSearchStore` state, triggering a new search/filter cycle.

#### Scenario: Restore filters and search query
- **WHEN** an authenticated user clicks a saved search entry in the dropdown
- **THEN** the search query is set to the saved `searchQuery`
- **AND** each filter's enabled state and value is restored from the saved state
- **AND** the `filters-changed` event is emitted so results update

#### Scenario: Unknown filter keys are ignored
- **WHEN** a saved search contains a filter key that no longer exists in `FilterManager`
- **THEN** that key is silently ignored and the remaining filters are still restored

---

### Requirement: Delete a saved search
An authenticated user SHALL be able to delete a saved search they own. The deletion SHALL be immediate (no soft-delete).

#### Scenario: Delete from dropdown
- **WHEN** an authenticated user clicks the delete action on a saved search entry
- **THEN** the row is removed from `human.saved_searches`
- **AND** the entry disappears from the dropdown list

---

### Requirement: SavedSearchMenu component encapsulation
All saved-search UI (dropdown trigger, list, save dialog, delete action) SHALL be encapsulated in a single `SavedSearchMenu.vue` component. This component SHALL accept the current filter state and search query as props, and emit events to restore a loaded search state.

#### Scenario: Component receives current state
- **WHEN** the `SavedSearchMenu` is rendered inside `FilterManager`
- **THEN** it receives the current `filters`, `enabledFilters`, and `searchQuery` as props

#### Scenario: Component emits load event
- **WHEN** a saved search is loaded via the component
- **THEN** the component emits a `load-search` event containing the deserialised filter state
- **AND** the parent `FilterManager` applies it

---

### Requirement: Saved searches refresh on project switch
When the user switches the active project, the saved searches list SHALL refresh to reflect the new project's saved searches.

#### Scenario: Project switch triggers refresh
- **WHEN** the user switches to a different project via `DeliverableHeader`
- **THEN** `SavedSearchMenu` fetches and displays saved searches for the newly active project

---

### Requirement: Pinboard lists the same saved searches as the filter menu

The pinboard (`PinBoardView` or successor) SHALL load `human.saved_searches` for the active project using the same client path as `SavedSearchMenu`, so the pinboard and filter sidebar always show the same named searches for that project without a separate “add to pinboard” step.

#### Scenario: New saved search appears on the pinboard

- **WHEN** an authenticated user saves a named search from `SavedSearchMenu` in the filter sidebar
- **THEN** that saved search SHALL appear on the project pinboard without inserting `human.pins` rows for it

### Requirement: Explorer floating action bar does not expose saved searches

The explorer floating action bar (`ActionBarExplorer` or successor for bottom results actions) SHALL NOT render `SavedSearchMenu` or any control whose sole purpose is listing or saving searches. Saved searches SHALL be available from the filter sidebar and the pinboard only.

#### Scenario: No saved-search picker on the action bar

- **WHEN** the explorer results page shows the floating action bar
- **THEN** it SHALL NOT include `SavedSearchMenu` or an equivalent duplicate saved-search entry point
