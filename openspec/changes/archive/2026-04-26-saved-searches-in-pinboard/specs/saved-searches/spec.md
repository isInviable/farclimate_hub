# saved-searches (change delta — as shipped)

## ADDED Requirements

### Requirement: Pinboard shows the same saved searches as the filter menu

The application SHALL load `human.saved_searches` for the pinboard using the same composable and project scope as `SavedSearchMenu` in `FilterManager`, so the pinboard list and the filter dropdown always reflect the same rows for the active project.

#### Scenario: Create in explorer appears on pinboard

- **WHEN** an authenticated user saves a new named search from `SavedSearchMenu` in the filter sidebar
- **THEN** that saved search SHALL appear on the project pinboard without any separate “add to pinboard” step

### Requirement: SavedSearchMenu optional list-only variant

The `SavedSearchMenu` component MAY support a `variant` prop (`full` | `list-only`) where `list-only` omits “save current search” and applies a chosen row via the same explorer handoff as the pinboard **Run search** control. This variant is optional; the product SHALL NOT require it on the explorer floating action bar.

#### Scenario: List-only is not required on the action bar

- **WHEN** engineers audit `ActionBarExplorer`
- **THEN** it SHALL NOT be required to mount `SavedSearchMenu` there for saved-search access

### Requirement: Explorer floating action bar excludes saved searches

The explorer floating action bar SHALL NOT expose saved-search listing or save controls. Access remains on the filter sidebar and pinboard per **pinboard-saved-searches** capability.

#### Scenario: No duplicate picker on the action bar

- **WHEN** the user uses the explorer floating action bar
- **THEN** no control on that bar SHALL duplicate `SavedSearchMenu` behaviour
