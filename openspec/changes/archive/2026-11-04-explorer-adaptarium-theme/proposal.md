# Proposal

## Why

The explorer pages still use the early FarClimate look: the old site header with the farclimate logo, an ink-on-off-white editorial palette, `trust-blue` as the primary color, and assorted raw Tailwind grays and accent colors. The public site (home, how-to, stories, skills, connected) has moved to the ADAPTARIUM design, so people who go from the home page into Solutions land on what looks like a different product. The designers have provided a recolored mock of the explorer that keeps the current layout and applies the ADAPTARIUM palette. The `site-design-tokens` rule that the explorer must look unchanged was a constraint for the early redesign stages and no longer applies.

This change first themed the explorer search page and now extends the same treatment to every page of the explorer application.

## What Changes

- Every explorer page shows the public-site top bar (ADAPTARIUM wordmark, EN / ES / IT, session control, menu): the explorer landing (`/explorer`), the search page, projects, the pin board, the public board, article pages, and login. The old `SiteHeader` no longer appears on them, and the menu opens the existing site navigation overlay.
  - The search, projects, and board pages stack the project bar under the top bar, as connected pages do with their section bar.
  - The public board shows a read-only project bar in the same style.
  - The landing, article pages, and login show only the top bar.
- All those pages render in the ADAPTARIUM palette, following the designers' mock:
  - sand page and panel background;
  - ink rules and text;
  - ADAPTARIUM blue for primary actions;
  - yellow view-mode tab strip on the search page;
  - orange Solutions accents;
  - teal, orange, and yellow for secondary, error, and warning states.
- The recolor reaches everything those pages open: the article side panel and the chat, insights, mind map, pin capture, PowerPoint, podcast, and comments dialogs.
- The `explorer` layout and the unused `main_explorer.css` are removed. `SiteHeader` stays only for pages outside the explorer that still use the default layout (about).

## Capabilities

### New Capabilities

- `explorer-visual-theme`: How the explorer pages adopt the ADAPTARIUM design: which pages are in the theme, the header each one shows, and the palette applied to page chrome, results, filters, boards, panels, and dialogs.

### Modified Capabilities

- `site-design-tokens`: "Existing tokens unchanged" no longer requires the explorer to look unchanged. The existing token values stay the same globally, and pages in the explorer theme may re-map them. A blue shade scale for the ADAPTARIUM blue is added so Nuxt UI's primary color can use it.
- `site-navigation`: "Existing header preserved elsewhere" no longer lists explorer or article pages as exceptions. They use the public-site top bar.

## Impact

- Layouts: new `solutions` layout used by all explorer pages except article pages. `article` layout switches to the top bar and the theme. `layouts/explorer.vue` removed.
- `assets/css/main.css`: an ADAPTARIUM blue shade scale, a scoped explorer theme that re-maps the `neutral-*`, `gray-*`, `slate-*`, primary, and semantic tokens, and an `explorer-adapt` variant. `assets/css/main_explorer.css` removed.
- `app.config.ts`: theme-only text colors for solid error and warning badges.
- Pages: `explorer/index.vue`, `explorer/explorer.vue`, `explorer/projects.vue`, `explorer/board/index.vue`, `explorer/board/public/[id].vue`, `articles/[id].vue`, `login.vue`.
- Components under `components/explorer/` that those pages render: project bar, filters, view modes, action bars, article panel and article sections, pin board and pin renderers, project dashboard, landing cards, wizards, and dialogs. The changes are a hand sweep of raw colors and hex literals plus accent classes. Components that are not rendered anywhere (`BoardList`, `AudioPlayer`, `ArticleSummaryView`, `dummyMap`) are left as they are.
- No API, data, or dependency changes. No new copy.
