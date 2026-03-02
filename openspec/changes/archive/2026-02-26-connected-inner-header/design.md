## Context

The Connected section currently consists of several Nuxt pages under
`apps/web/app/pages/connected/`:

- `dashboard.vue`
- `EntitiesMap.vue`
- `PrjEntConnected.vue`
- `ProjectsUmapNew.vue`

Each page renders its own content but shares only the global site header and
layout. In the Figma designs, however, each Connected view has a dedicated
inner header at the top of the content area that:

- Shows a title and short description for the specific view.
- Provides a row of navigation links/tabs to other Connected pages.
- Highlights the active page according to the current route.

We want to implement this inner header as a reusable pattern so all Connected
pages feel like part of a single “Connected” workspace.

## Goals / Non-Goals

**Goals:**

- Provide a reusable **Connected inner header** component or layout that:
  - Renders a consistent title/description area.
  - Renders navigation items (tabs/links) for all Connected routes.
  - Highlights the active tab based on the current route.
- Integrate this header into all pages under `pages/connected/` with minimal
  duplication.
- Use Nuxt’s layout and component patterns cleanly (e.g. `layouts/connected.vue`
  and a `ConnectedHeader` component).
- Keep the implementation close to the Figma design while leveraging existing
  UI primitives from `@nuxt/ui` and the project’s CSS.

**Non-Goals:**

- No changes to the Connected data models or APIs.
- No changes to global site navigation or routing structure beyond adding inner
  links for existing Connected routes.
- No new authentication or permission logic.
- No major refactor of Connected page content; only the header/inner layout is
  adjusted.

## Decisions

1. **Use a dedicated layout for Connected pages**

   - **Decision**: Introduce a `layouts/connected.vue` layout that:
     - Wraps the page content.
     - Renders the new `ConnectedHeader` at the top of the main content region.
   - **Rationale**: Using a layout avoids repeating header markup in each page
     and allows any future Connected page to opt in simply by declaring
     `definePageMeta({ layout: 'connected' })`.
   - **Alternative**: Manually import and place a `ConnectedHeader` component in
     each page. Rejected because it duplicates boilerplate and is easy to
     forget when adding new pages.

2. **Create a `ConnectedHeader` component with declarative config**

   - **Decision**: Implement `ConnectedHeader.vue` under
     `app/components/connected/` that:
     - Accepts:
       - `title: string`
       - `description?: string`
       - `items: { label: string; to: string; icon?: string }[]`
     - Uses the current route (`useRoute()`) to determine which item is active.
     - Maps each item to a `NuxtLink` / `UButton` styled according to the Figma
       tabs.
   - **Rationale**: A component with an `items` prop or internal config makes it
     easy to maintain the set of Connected routes and reuse the same visual
     structure across pages.
   - **Alternative**: Hardcode all labels/links inside the layout. Rejected to
     keep the header reusable and possibly testable on its own.

3. **Centralize navigation config in a small helper**

   - **Decision**: Create a simple navigation config (e.g.
     `app/components/connected/connectedNav.ts` or inline in
     `ConnectedHeader.vue`) that enumerates Connected pages:
     - Dashboard
     - Entities map
     - Project–Entity connections
     - Projects UMAP
   - **Rationale**: Having a single source of truth for Connected routes
     reduces drift between pages and ensures the header always shows a
     consistent set of links.

4. **Per-page title/description from layout slots or metadata**

   - **Decision**: Allow each page to provide its own title/description via:
     - Either props to `ConnectedHeader` (passed from layout using page-level
       metadata), or
     - Named slots (`#title`, `#description`) if we want high flexibility.
   - **Rationale**: Different Connected pages have different descriptive
     subtitles in the Figma design; we should not hardcode a single text.
   - **Chosen approach**: Use page-level metadata + a simple mapping to
     `ConnectedHeader` props for ease of use.

5. **Use Nuxt UI components for look & feel**

   - **Decision**: Build the header using `UContainer`, `UButton`/`UTabs` (or
     similar) plus tailwind utility classes from the existing `main.css`, to
     approximate the Figma design without introducing a new UI system.
   - **Rationale**: Keeps consistency with the rest of the app and avoids new
     design system dependencies.

6. **Use the existing design tokens and classes**
   - **Decision**: Use the existing design tokens and classes from the existing `main.css` file to style the header.
   - **Rationale**: Keeps consistency with the rest of the app and avoids new
     design system dependencies.
   - **Alternative**: Create a new design system for the header. Rejected because
     it would be a lot of work and not worth the effort.

## Risks / Trade-offs

- **Risk**: Route names or paths change later, causing header links to break.
  - **Mitigation**: Centralize links in a single config file and refer to that
    in both `ConnectedHeader` and any other navigation that depends on them.

- **Risk**: Layout adoption is incomplete (some Connected pages forget to opt
  into the new layout).
  - **Mitigation**: Update all existing Connected pages in a single change and
    document “use `layout: 'connected'`” as the standard for future pages.

- **Risk**: Visual mismatch with Figma if not carefully tuned.
  - **Mitigation**: Iterate on spacing, typography, and colors using the
    existing design tokens and classes; keep the header component small and easy
    to tweak.

