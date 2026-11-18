# Design

## Context

`pages/explorer/explorer.vue` uses `layout: 'explorer'`. That layout renders the old `SiteHeader`, the page slot, `SiteFooter`, and `AuthRequiredModal`. The page itself renders `DeliverableHeader` (the project bar) above a 3/9 grid: a sticky `FilterManager` sidebar (`sticky top-0 h-screen`) and the results column with the view-mode tab strip. The same layout and `DeliverableHeader` are used by `projects.vue` and `board/index.vue`. `ArticleSidePanel`, `ViewModeChat`, `ViewModeSummaries`, `PinCaptureDialog`, and `MarkmapViewer` are also rendered on the board.

Colors in the explorer scope (about 98 files) are expressed as:

- `neutral-*` named shades from `main.css` (`darkest` 204 uses, `dark` 90, `lightest` 80, plus a few `lighter`/`darker`), and a handful of Tailwind's numeric `neutral-50..900`;
- Nuxt UI `primary` (`color="primary"`, `text-primary`, `bg-primary-600`), which resolves to `trust-blue` (`--ui-primary: #1e63a2`);
- `gray-*` leftovers (131, mostly `text-gray-500/600`, `border-gray-200`, `bg-gray-50`);
- about 45 raw `blue/sky/teal/slate/amber/red/...` classes and 9 hex literals, mostly map and chart colors.

Nuxt UI registers `primary-N` and numeric `neutral-N` with `@theme inline`, so utilities such as `bg-primary-600` compile to `var(--ui-color-primary-600)`. Named neutrals (`neutral-darkest`, ...), `gray-*`, and `slate-*` compile to their own `--color-*` variables. `--ui-text`, `--ui-bg`, and `--ui-border` (and their variants) are declared on `:root` in terms of `--ui-color-neutral-*`. Custom properties are resolved where they are declared, so a nested override of `--ui-color-neutral-*` does not change them.

`main_explorer.css` is not loaded (`nuxt.config.ts` lists only `main.css`), so nothing competes with the new rules.

The other explorer pages:
- `explorer/index.vue` (landing) uses the `default` layout: `SiteHeader` in transparent mode over a hero.
- `projects.vue` and `board/index.vue` use the `explorer` layout and render `DeliverableHeader` themselves.
- `board/public/[id].vue` has no layout meta, so it gets `default`, and renders `PublicBoardHeader` (a grey bar with the old logo).
- `articles/[id].vue` uses the `article` layout: `SiteHeader` over a full-height `h-dvh` column with no footer.
- `login.vue` uses `layout: false` with a centred `gray-*` card.

No component under `components/explorer/` is rendered outside these pages. `BoardList`, `AudioPlayer`, `ArticleSummaryView`, and `dummyMap` are not rendered anywhere.

## Goals / Non-Goals

**Goals:**

- Retheme every explorer page and everything it opens, with the smallest per-component diff.
- Leave non-explorer pages (connected, admin, about, and the public site) exactly as they are.

**Non-Goals:**

- Renaming `neutral-*` classes across components. Class names keep their current meaning outside the theme.
- Retiring `SiteHeader`, which `layouts/default.vue` still uses for the about page.
- Restyling components that are never rendered.
- Changing map or chart data colors, typography, spacing, or component structure.
- Dark mode.

## Decisions

### A new `solutions` layout for the themed explorer pages

Add `layouts/solutions.vue`: `SiteTopBar mode="bar"`, the page slot, `SiteFooter`, `SiteNavOverlay`, and `AuthRequiredModal`. The layout is named after the Solutions section, which owns the explorer in `siteNav`. It is used by:
- the search, projects, and board pages, which keep rendering `DeliverableHeader` themselves directly under the top bar (the stacked header);
- the public board, which renders `PublicBoardHeader` restyled as a read-only project bar;
- the landing and login, which render no project bar.

`layouts/explorer.vue` then has no users and is removed, along with the unused `main_explorer.css`.

The article page keeps its own `article` layout because it needs a fixed `h-dvh` column with no footer. That layout swaps `SiteHeader` for `SiteTopBar` and adds `SiteNavOverlay`.

### Scope the theme with a body class

Both layouts call a small `useExplorerTheme()` composable, which runs `useHead({ bodyAttrs: { class: 'theme-explorer-adapt' } })`. Nuxt removes the class when the layout unmounts, so client-side navigation to the board drops the theme. Putting the class on `<body>` rather than on a wrapper `div` is deliberate. Nuxt UI modals, slideovers, dropdowns, and tooltips portal to `<body>`, so they are inside the scope without any per-component work. The article side panel and the chat, insights, and mind map dialogs are covered this way.

### Re-map tokens inside the scope instead of rewriting classes

In `main.css`, a `.theme-explorer-adapt` rule in `@layer base` redefines the variables that utilities and Nuxt UI read:

| Variable(s) | Themed value |
|---|---|
| `--color-neutral-lightest` | sand `#eeeadf` |
| `--color-neutral-lighter` / `-light` / base / `-dark` / `-darker` | warm ink tints between sand and ink; `-dark` at least 4.5:1 on sand |
| `--color-neutral-darkest` | ink `#2c2c2c` |
| `--ui-color-neutral-50..950` (numeric neutral utilities) | same warm tint ramp |
| `--color-gray-50..950`, `--color-slate-50..950` | same warm tint ramp |
| `--ui-color-primary-50..950` | `--color-adapt-blue-50..950` |
| `--ui-primary` | `#0f4fc4` |
| `--ui-text*`, `--ui-bg*`, `--ui-border*` | ink tints, sand, and paper from the same ramp |

Because the overrides only exist under the body class, shared components keep their exact current colors on unthemed pages, and the 472 `neutral-*` uses and 131 `gray-*` uses need no edits. Tailwind opacity modifiers such as `bg-neutral-darkest/5` keep working because they use `color-mix` with the variable.

Alternative: a class sweep to `adapt-*` names. It would make the theme greppable, but it would change shared components on the board and projects pages now, and the diff would be large. Class renames can be revisited when every explorer page is in the theme.

Alternative: change the global tokens and `app.config` `primary`. That would also recolor connected (233 `neutral-*` uses) and admin (22 `primary` uses). The `site-design-tokens` spec forbids that.

### Redefine the variables the utilities read

Per the Context note, the scope sets `--ui-color-primary-N` and `--ui-color-neutral-N` (read by the inline utilities), `--color-neutral-<name>`, `--color-gray-N`, and `--color-slate-N`. It also sets `--ui-primary`, `--ui-text*`, `--ui-bg*`, and `--ui-border*` directly, because those are resolved on `:root`.

### ADAPTARIUM blue scale in `@theme`

Add `--color-adapt-blue-50..950` to the `@theme static` block, anchored at 600 = `#0f4fc4`, with lighter steps mixed toward white and darker steps toward navy. Explorer code uses `primary-600` as "the" primary (`bg-primary-600` in `ActionBarBase`, `FilterComponent`, `.sidebar-row-active`), so anchoring at 600 makes those render exactly the brand blue. The existing `adapt-blue` token is untouched.

### Theme-only accents through a custom variant

Add `@custom-variant explorer-adapt (&:where(.theme-explorer-adapt, .theme-explorer-adapt *));`. Accents that have no old equivalent are added as variant classes beside the existing ones:

- `DeliverableHeader` menu button: `explorer-adapt:bg-adapt-orange explorer-adapt:border-adapt-orange`, plus an orange rule beside the project name.
- `FilterComponent` enabled state: switch `explorer-adapt:` orange and `explorer-adapt:border-l-adapt-orange`.
- Any raw `blue/sky/teal` chrome class on the page gets an `explorer-adapt:` override toward the palette.

The variant was needed while only the search page was themed. Now that every page rendering explorer components is themed, remaining leftovers in those components (pin board, project dashboard, wizards, landing) are edited directly to palette classes. The existing variant classes stay, because they are harmless. The view-mode tab strip lives only in `explorer.vue`, so it uses `bg-adapt-yellow` directly.

### Landing, public board, and login specifics

- Landing: the hero sits below the sticky top bar. The three sector cards' title colors (`community-pink`, `trust-blue`, `grounded-green`) become orange, blue, and teal. The green arrow block beside "View all" becomes orange.
- Public board: `PublicBoardHeader` adopts the project bar language: hairline ink bottom rule, an orange mark, the project name in the display font, and a mono "view only" eyebrow. The old logo image is dropped.
- Login: the centred card keeps its structure. `gray-*` classes go through the scope, the `dark:` variants are dropped because the site has no dark mode, and the page background becomes sand.

Alternative: theme-controlled accent tokens with old-look defaults. A filled orange square has no "same as before" value (the old button is outlined), so that approach would need two tokens per accent and is harder to read.

### Semantic colors re-mapped in the scope

The scope also sets `--ui-secondary` to teal, `--ui-error` to orange, and `--ui-warning` to yellow, so `color="secondary|error|warning"` badges and alerts follow the palette. Solid badges get their text color from `app.config` compound variants. `secondary` already uses white text, which suits teal. The `error` and `warning` entries add `explorer-adapt:text-adapt-ink`, so unthemed pages keep their current white and black text.

`error` is also used for real error states. Inside the theme those turn orange, which is the only warm alert color in the palette. `success` (used by list match badges and pin kind badges) is left as it is.

### Sidebar offset for the sticky top bar

`SiteTopBar` is `sticky top-0 h-14`. The filter sidebar becomes `sticky top-14 h-[calc(100dvh-3.5rem)]` so it sits under the bar and its last group stays reachable. `DeliverableHeader` remains in normal flow and scrolls away, as it does now.

### Hex literals and data colors

Map and chart marks (`MapBase`, `ViewModeBioregionUmap`, region and impact colors) are data encodings and stay as they are. Chrome-only literals, such as a marker stroke matching the old ink or a selected-state blue, switch to the palette where the component is only rendered on the search page. Where the component is shared, they read the CSS variable instead (`var(--color-neutral-darkest)`), so the scope handles them.

## Risks / Trade-offs

- [Class names no longer describe the rendered color inside the theme (`neutral-darkest` renders ink, `gray-500` renders a warm tint)] → Accept for now. The theme block in `main.css` documents the mapping in one place. Revisit class names after every explorer page is themed.
- [Components that hard-code `bg-white` stay white on sand] → Intentional for raised surfaces (cards, popovers). Task group 4 audits `bg-white` on the search page and converts flat panels to `bg-neutral-lightest` only in page-only components. Shared components get `explorer-adapt:bg-neutral-lightest`.
- [A portal that mounts outside `<body>`, or a library that injects inline colors (markmap, map tiles), escapes the theme] → Covered by the computed-colors audit in the spec. Fix individual cases with the variant.
- [Small badge text on palette colors is just under 4.5:1 (ink on orange 4.09:1, white on teal 3.9:1)] → Accept it for the brand palette. The badges are bold uppercase labels, and the higher-contrast text color is used for each.
- [Muted text tints on sand fall below contrast] → `-dark` and `--ui-text-muted` are chosen to reach at least 4.5:1 on `#eeeadf` and are checked in task 1.2.
- [The body class leaks if the layout is kept alive across navigation] → `useHead` entries are disposed on unmount. Verify by navigating search → connected → search.
- [Login now shows the top bar, whose session control links back to login] → Harmless: the link reloads login with the same `returnTo`.

## Migration Plan

Pure front-end change, shipped with the web app. Rollback is reverting the change. The scoped CSS and the variant classes are inert without the body class.
