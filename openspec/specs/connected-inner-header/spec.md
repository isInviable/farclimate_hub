# connected-inner-header Specification

## Purpose

Defines the Connected inner header and the layout that places it above Connected page content.

## Requirements

### Requirement: Connected inner header component
The system SHALL provide a `ConnectedHeader` UI component that renders:
- A page-specific title.
- An optional description/subtitle.
- A row of navigation items for all Connected pages.

The component SHALL accept a configuration of navigation items in the form:
`{ label: string; to: string; icon?: string }[]` and SHALL use the current
route to determine which item is active.

#### Scenario: Active page highlighting
- **WHEN** the current route path matches a navigation item’s `to` value
- **THEN** the corresponding item in the header SHALL be visually highlighted
  as active according to the design system (e.g. different background or text
  color)

#### Scenario: Navigation between Connected pages
- **WHEN** a user clicks a navigation item in the inner header
- **THEN** the system SHALL navigate to the corresponding Connected page using
  the Nuxt router, and the header SHALL update its active state accordingly

### Requirement: Connected layout uses inner header
The connected layout SHALL wrap the visualization pages. It SHALL render the public-site top bar first and the inner header directly beneath it.

The dashboard, entities map, project–entity network, and projects UMAP SHALL use this layout. The connected index SHALL NOT use this layout.

#### Scenario: Existing Connected pages adopt the layout
- **WHEN** a user visits any of the following routes:
  - `/connected/dashboard`
  - `/connected/EntitiesMap`
  - `/connected/PrjEntConnected`
  - `/connected/ProjectsUmapNew`
- **THEN** the page shows the public-site top bar, then the inner header, then the page content

#### Scenario: Index uses the public site layout
- **WHEN** a user visits `/connected`
- **THEN** the page uses the same top bar, overlay, and footer as the how-to page and does not show the inner header
