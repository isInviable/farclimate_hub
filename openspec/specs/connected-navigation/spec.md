# connected-navigation Specification

## Purpose

Defines how people move between Connected pages: the inner header lists the visualization views and stays available when a visualization is opened directly.

## Requirements

### Requirement: Connected navigation via inner header
The Connected section navigation SHALL be exposed primarily through the
inner header, which provides links to all major Connected visualization pages.

Global navigation MAY still link into the Connected area, but within the
section itself the inner header SHALL be the main way to move between
the visualization pages. The connected index SHALL NOT show the inner header.

#### Scenario: Consistent navigation set
- **WHEN** a user opens the dashboard, the entities map, the project–entity
  network, or the projects UMAP
- **THEN** the inner header SHALL display a consistent set of navigation items
  representing the main Connected views (dashboard, entities map, project–entity
  connections, projects UMAP), regardless of which page is currently active

#### Scenario: Deep linking support
- **WHEN** a user navigates directly to a specific Connected visualization route via URL
  (e.g. by bookmarking or sharing a link)
- **THEN** the inner header SHALL still render and highlight the correct active
  navigation item without requiring the user to first visit the Connected
  dashboard

#### Scenario: Index has no inner header
- **WHEN** a user opens the connected index
- **THEN** the inner header is not shown
