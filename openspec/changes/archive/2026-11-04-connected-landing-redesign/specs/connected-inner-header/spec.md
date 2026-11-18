# Spec Delta

## MODIFIED Requirements

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
