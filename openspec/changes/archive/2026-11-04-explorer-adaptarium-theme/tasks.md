# Tasks

## 1. Theme tokens and scope

- [x] 1.1 Add `--color-adapt-blue-50..950` to the `@theme static` block in `apps/web/app/assets/css/main.css`, anchored at 600 = `#0f4fc4`, lighter toward white and darker toward navy, leaving `--color-adapt-blue` unchanged; verify `--color-adapt-blue-600` resolves to `#0f4fc4` in the browser and the steps darken monotonically.
- [x] 1.2 Add the `.theme-explorer-adapt` rule in `@layer base` of `main.css` redefining `--color-neutral-{lightest,lighter,light,(base),dark,darker,darkest}`, `--ui-color-neutral-50..950`, `--color-gray-50..950`, `--color-slate-50..950`, `--ui-color-primary-50..950` (to the adapt-blue scale), `--ui-primary`, and the `--ui-text*` / `--ui-bg*` / `--ui-border*` variables. Use the values in design.md: sand `#eeeadf`, ink `#2c2c2c`, and a warm tint ramp whose `-dark` step and `--ui-text-muted` reach at least 4.5:1 on sand. Add a short comment block naming the mapping. Verify with a contrast checker for `-dark` and `--ui-text-muted` on `#eeeadf`.
- [ ] 1.3 Add `@custom-variant explorer-adapt (&:where(.theme-explorer-adapt, .theme-explorer-adapt *));` to `main.css`; verify `pnpm --filter web build` (or `nuxt build` in `apps/web`) compiles without CSS errors.
- [x] 1.4 Add `apps/web/tests/utils/explorerTheme.test.ts` that reads `main.css` and asserts the adapt-blue 600 step is `#0f4fc4`, `--color-adapt-blue` is still `#0f4fc4`, and the `.theme-explorer-adapt` block sets `--color-neutral-darkest`, `--color-neutral-lightest`, `--ui-color-primary-600`, `--ui-color-neutral-900`, `--color-gray-500`, `--ui-primary`, and `--ui-bg`; verify `pnpm vitest run tests/utils/explorerTheme.test.ts` passes.

## 2. Solutions layout and stacked header

- [x] 2.1 Create `apps/web/app/layouts/solutions.vue` with `SiteTopBar mode="bar"`, the page slot, `SiteFooter`, `SiteNavOverlay`, and `AuthRequiredModal`, and set the theme body class; verify `nuxt typecheck` reports no errors in the file.
- [x] 2.2 Switch `pages/explorer/explorer.vue` to `layout: 'solutions'`, keeping `DeliverableHeader` as the first element of the page; verify in the browser that `/explorer/explorer` shows the ADAPTARIUM top bar, then the project bar, and no farclimate-logo header.
- [x] 2.3 Change the filter sidebar in `explorer.vue` from `sticky top-0 h-screen` to `sticky top-14 h-[calc(100dvh-3.5rem)]`; verify by scrolling a long result list that the sidebar sits under the top bar and the last filter group can be scrolled into view.
- [x] 2.4 Verify the menu button opens the overlay with Solutions marked active, ES / IT switch to `/es/explorer/explorer` and `/it/explorer/explorer`, sign-in in the top bar returns to the explorer, and sign-out goes to the home page like the rest of the site.
- [x] 2.5 Verify the theme stays scoped: navigate client-side from `/explorer/explorer` to `/connected` and confirm `<body>` no longer has `theme-explorer-adapt` and the connected page keeps its colors, then return and confirm the theme is back.

## 3. Page-level palette on the search page

- [x] 3.1 Restyle the view-mode tab strip in `explorer.vue` to `bg-adapt-yellow` with ink labels, an ink underline, and a bold label on the active tab; verify each of the five tabs shows the active state only when selected.
- [x] 3.2 Replace the gantt placeholder's `bg-gray-100` / `text-gray-500` and the mind map dialog's `border-gray-200` / `text-gray-500` in `explorer.vue` with `neutral-*` tokens; verify by opening the mind map dialog that its frame and spinner use theme colors.
- [x] 3.3 Verify in the browser that the page, sidebar, and list background render sand, that rules render ink, and that the result count and eyebrows are readable.

## 4. Search page components: accents and leftovers

- [x] 4.1 `DeliverableHeader`: add `explorer-adapt:` classes making the project menu button a filled orange square and the divider beside the project name orange; verify on `/explorer/explorer` that both are orange and the pins board button is ADAPTARIUM blue.
- [x] 4.2 `FilterComponent` and filter children under `components/explorer/deliverable1/`: make an enabled group's switch and left-edge marker orange and its icon ink, and convert flat panel `bg-white` to `bg-neutral-lightest`; verify by enabling the climate impacts group.
- [x] 4.3 Result view modes (`ViewModeListSimple`, `ViewModeGrid`, `ViewModeGridHitContext`, `ViewModeInstagram*`, `ViewModeMap`, `ViewModeBioregionUmap`) and `ExplorerResultsToolbar`: override raw `blue/sky/teal` chrome classes, and switch chrome-only hex literals to palette tokens, leaving data colors as they are; verify each view on the search page against the designers' mock (blue sector labels and checkboxes, ink rules).
- [x] 4.4 `ActionBarBase` / `ActionBarExplorer`: confirm the accent variant renders ADAPTARIUM blue via the scoped primary scale, and that its count chip and labels are readable; verify with results selected.
- [x] 4.5 `ArticleSidePanel` and `components/explorer/article/*`: replace `text-trust-blue-darkest` / `prose-a:text-trust-blue-darkest` in `SummaryContactsSection` with `text-primary` / `prose-a:text-primary`, and override other raw chrome colors; verify an opened article shows sand surfaces, ink text, and blue links on the search page.
- [x] 4.6 `ViewModeChat`, `ViewModeSummaries`, `PinCaptureDialog`, `ExplorerSearchLoadingOverlay`, `ExplorerSearchEmptyState`: override raw chrome colors; verify by opening chat, insights, and pin capture from the search page.
- [x] 4.7 Set `--ui-secondary` (teal), `--ui-error` (orange), and `--ui-warning` (yellow) in the `.theme-explorer-adapt` block. Add `explorer-adapt:text-adapt-ink` to the solid `error` and `warning` badge compound variants in `app.config.ts` (`secondary` already uses white text). Extend `explorerTheme.test.ts` to assert the three variables. Verify that the article panel badges on the search page render teal, orange, and yellow.

## 5. Remaining explorer pages

- [x] 5.1 Add `composables/useExplorerTheme.ts` (sets the theme body class through `useHead`) and use it from `layouts/solutions.vue`; verify the search page still gets `theme-explorer-adapt` on `<body>`.
- [x] 5.2 Switch `pages/explorer/projects.vue` and `pages/explorer/board/index.vue` to `layout: 'solutions'`, then delete `layouts/explorer.vue` and the unused `assets/css/main_explorer.css`; verify `rg "layout: ['\"]explorer"` returns nothing and both pages show the top bar above the orange-accented project bar.
- [x] 5.3 Projects page components (`ProjectsStatisticsSection`, `ProjectCard`, `ProjectsDashboardHeader`, `ProjectsEmptyState`, and the `text-primary-600` spinner in `projects.vue`): replace `trust-blue` / `grounded-green` / `resilient-yellow` tiles with blue, teal, and yellow palette tints and ink icons; verify on `/explorer/projects` that no old palette color remains.
- [x] 5.4 Pin board components (`PinBoardView`, `PinBoardSidebar`, `PinBoardCard`, `PinBoardMap`, `PinRender*`, `PinBoardArtifactsView`, `ActionBarBoard`, `PodcastCreationWizard`, `PowerPointCreationWizard`, `powerpoint/*`, `VideoPlayer`): replace `warm-neutral-*`, `trust-blue-*`, `teal-*`, `sky-*`, `blue-*`, and `amber-*` chrome classes with neutral / primary / palette classes, keeping map data colors; verify `/explorer/board` and its PowerPoint and podcast dialogs show sand surfaces, ink rules, and blue primary actions.
- [x] 5.5 Public board: give `pages/explorer/board/public/[id].vue` `layout: 'solutions'`, and restyle `PublicBoardHeader` as a read-only project bar (ink bottom rule, orange mark, display-font project name, mono "view only" eyebrow, no logo image); restyle `PublicActionBar` / `PublicCommentsModal` leftovers; verify a public board link shows the top bar and the read-only bar.
- [x] 5.6 Landing: switch `pages/explorer/index.vue` to `layout: 'solutions'`, map the sector card title colors to orange / blue / teal, and change the green arrow block beside "View all" to orange; verify `/explorer` shows the top bar, the hero below it, and no old palette colors.
- [x] 5.7 Article page: in `layouts/article.vue`, replace `SiteHeader` with `SiteTopBar mode="bar"`, add `SiteNavOverlay`, and call `useExplorerTheme()`; verify `/articles/:id` shows the top bar, the themed article view, and teal / orange / yellow badges.
- [x] 5.8 Login: give `pages/login.vue` `layout: 'solutions'`, drop the `dark:` variants, and style the heading, subtitle, and card in the theme palette; verify `/login` shows the top bar, a sand background, an ink heading, and a blue submit button.

## 6. Integration checks

- [ ] 6.1 Run the computed-colors audit from the `explorer-visual-theme` spec on every themed page: each search page view mode with the side panel and chat open, projects, board, public board, landing, an article page, and login. Report any `rgb(30, 99, 162)`, `rgb(16, 0, 7)`, or `rgb(255, 251, 248)`, and fix hits outside chart and map data marks.
- [ ] 6.2 Capture screenshots of each themed page and of `/connected` and `/about`. Verify the explorer pages match the mock's palette and that connected and about are unchanged.
- [ ] 6.3 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` in `apps/web` and verify they pass.

## Workflow follow-up

- Retire `SiteHeader` and `layouts/default.vue` once the about page moves to the new design.
- Archive this change after review.
