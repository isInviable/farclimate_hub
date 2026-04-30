# human-pins-frontend (change delta — as shipped)

## ADDED Requirements

### Requirement: Pinboard view integrates saved searches without new pin body_kind

`PinBoardView` (or successor used on `/explorer/board` and public board pages) SHALL fetch and render saved searches from `human.saved_searches` in addition to `human.pins`, using dedicated cards or sections that are not `PinBoardCard` rows backed by `human.pins`. Legacy `human.pins` rows with `body_kind` `saved_search`, if any, MAY render through the existing unknown-kind fallback until removed from the database.

#### Scenario: Sidebar includes saved searches category

- **WHEN** the pinboard renders for a project with saved searches
- **THEN** the sidebar SHALL include a **Saved searches** entry with an accurate count and the main grid SHALL be able to filter to that category

### Requirement: Explorer floating action bar has no saved-search UI

`ActionBarExplorer` SHALL NOT include `SavedSearchMenu` or any saved-search-only control. This SHALL hold for the shipped layout after this change.

#### Scenario: Action bar composition

- **WHEN** the explorer page renders `ActionBarExplorer`
- **THEN** its template SHALL not import or render `SavedSearchMenu`
