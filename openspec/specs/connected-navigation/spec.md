## ADDED Requirements

### Requirement: Connected navigation via inner header
The Connected section navigation SHALL be exposed primarily through the
`ConnectedHeader` inner header component, which provides links to all major
Connected pages.

Global navigation MAY still link into the Connected area, but within the
section itself the inner header SHALL be the main way to move between
Connected pages.

#### Scenario: Consistent navigation set
- **WHEN** any Connected page is rendered
- **THEN** the inner header SHALL display a consistent set of navigation items
  representing the main Connected views (dashboard, entities map, project–entity
  connections, projects UMAP), regardless of which page is currently active

#### Scenario: Deep linking support
- **WHEN** a user navigates directly to a specific Connected route via URL
  (e.g. by bookmarking or sharing a link)
- **THEN** the inner header SHALL still render and highlight the correct active
  navigation item without requiring the user to first visit the Connected
  dashboard

