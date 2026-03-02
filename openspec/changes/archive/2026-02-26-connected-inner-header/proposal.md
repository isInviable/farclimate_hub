## Why

The `apps/web/app/pages/connected/` section currently reuses the global site
header and does not have its own inner navigation that reflects the structure
of the “Connected” workspace. In the Figma dashboard designs, each Connected
page has a dedicated inner header with:
- A clear title and short description for the current view.
- Tabs/links to switch between Connected subpages (e.g. Dashboard, Entities
  map, Project–Entity connections, Projects UMAP).

Without this, users have to rely on side navigation or browser back/forward,
and the Connected area feels less like a cohesive product and more like a set
of disconnected pages. Aligning the implementation with the Figma inner header
improves orientation, cross-navigation, and visual consistency.

## What Changes

- Introduce a **Connected inner header** UI component (or layout) that matches
  the Figma design:
  - Displays the section title and brief description.
  - Exposes navigation links/tabs for all Connected pages.
  - Highlights the active page based on the current route.
- Apply this inner header to all pages under `app/pages/connected/`:
  - `dashboard.vue`
  - `EntitiesMap.vue`
  - `PrjEntConnected.vue`
  - `ProjectsUmapNew.vue`
- Define a reusable layout or composition pattern (e.g.
  `layouts/connected.vue` or a `ConnectedHeader` component) so new Connected
  pages can adopt the same inner header with minimal boilerplate.
- Ensure the header links route to the existing Connected pages and that the
  active state stays in sync with the Nuxt router.

## Capabilities

### New Capabilities

- `connected-inner-header`:
  A reusable inner header for the Connected section that provides contextual
  title/description and navigation links between Connected subpages. This
  capability covers the visual structure, active-state behavior, and how it is
  wired into Nuxt layouts/pages.

### Modified Capabilities

- `connected-navigation`:
  The Connected area’s navigation behavior is updated so that the inner header
  becomes the primary way to move between Connected pages, complementing any
  existing global navigation. This clarifies the contract that Connected pages
  share a common header and route-level tabs.

## Impact

- **Code**:
  - New layout/component under `apps/web/app/layouts/connected.vue` and/or
    `apps/web/app/components/connected/ConnectedHeader.vue`.
  - Updates to all Connected pages:
    - `apps/web/app/pages/connected/dashboard.vue`
    - `apps/web/app/pages/connected/EntitiesMap.vue`
    - `apps/web/app/pages/connected/PrjEntConnected.vue`
    - `apps/web/app/pages/connected/ProjectsUmapNew.vue`
  - Delete similar but incomplete header in:
    - - `apps/web/app/pages/connected/dashboard.vue`
- **Routing**:
  - Uses existing routes; no new API endpoints.
  - May standardize route names/paths in the header config (e.g. for
    highlighting and linking).
- **Design / UX**:
  - Aligns Connected pages with the provided Figma dashboard designs.
  - Makes it easier to add future Connected pages using the same inner header
    pattern.

