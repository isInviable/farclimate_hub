## 1. Connected Layout and Header Component

- [x] 1.1 Create `apps/web/app/layouts/connected.vue` that wraps page content and reserves a top area for the Connected inner header.
- [x] 1.2 Create `apps/web/app/components/connected/ConnectedHeader.vue` that accepts `title`, `description`, and `items: { label: string; to: string; icon?: string }[]` props and renders the header according to the Figma design.
- [x] 1.3 Add a small navigation config (e.g. `connectedNav` array) that lists all Connected routes (dashboard, entities map, project–entity connections, projects UMAP) and their labels/icons.

## 2. Wire Layout into Connected Pages

- [x] 2.1 Update each page under `apps/web/app/pages/connected/` (`dashboard.vue`, `EntitiesMap.vue`, `PrjEntConnected.vue`, `ProjectsUmapNew.vue`) to use `definePageMeta({ layout: 'connected' })`.
- [x] 2.2 For each page, provide the appropriate title/description (via props or metadata) to `ConnectedHeader` so that the header text matches the Figma design.
- [x] 2.3 Ensure the inner header's active tab correctly reflects the current route for each Connected page.
- [x] 2.4 Delete similar but incomplete header in `apps/web/app/pages/connected/dashboard.vue`
## 3. Styling and Responsiveness

- [x] 3.1 Style `ConnectedHeader.vue` using existing `@nuxt/ui` components and project CSS so that spacing, typography, and colors closely match the provided Figma frames and uses the existing design tokens and classes in the `main.css` file.
- [x] 3.2 Verify that the inner header behaves correctly on smaller screens (e.g. tabs wrap or scroll as needed) without overlapping other UI elements.

## 4. Verification

- [x] 4.1 Manually test navigation between all Connected pages using the inner header and confirm that the URL, content, and active state update correctly.
- [x] 4.2 Confirm that deep-linking to each Connected route (via direct URL) shows the correct page content and active tab in the header.
- [x] 4.3 Run `pnpm typecheck` and fix any new TypeScript errors introduced by the new layout and header component.
