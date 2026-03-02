## ADDED Requirements

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
The system SHALL introduce a Nuxt layout (e.g. `layouts/connected.vue`) that:
- Wraps the main content of all Connected pages.
- Renders the `ConnectedHeader` at the top of the content area.

Connected pages under `app/pages/connected/` SHALL opt into this layout via
`definePageMeta({ layout: 'connected' })` or equivalent configuration.

#### Scenario: Existing Connected pages adopt the layout
- **WHEN** a user visits any of the following routes:
  - `/connected/dashboard`
  - `/connected/entities-map` (or equivalent path)
  - `/connected/project-entity-connected`
  - `/connected/projects-umap-new`
- **THEN** the page content SHALL render under the Connected layout and the
  inner header SHALL be visible above the main content

