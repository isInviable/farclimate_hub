# explorer-visual-theme Specification

## Purpose

Defines how the explorer pages adopt the ADAPTARIUM design: which pages are in the theme, the header each one shows, and the palette applied to their chrome, results, filters, boards, panels, and dialogs.

## Requirements

### Requirement: Themed explorer pages
The following pages SHALL render in the ADAPTARIUM explorer theme, in every locale (`/`, `/es`, `/it` prefixes): the explorer landing (`/explorer`), the explorer search page (`/explorer/explorer`), projects (`/explorer/projects`), the pin board (`/explorer/board`), the public board (`/explorer/board/public/:id`), article pages (`/articles/:id`), and login (`/login`). Pages outside this list SHALL NOT render with the theme.

#### Scenario: Search page themed
- **WHEN** a user opens `/explorer/explorer`, `/es/explorer/explorer`, or `/it/explorer/explorer`
- **THEN** the page renders with the ADAPTARIUM explorer theme

#### Scenario: Other explorer pages themed
- **WHEN** a user opens the explorer landing, projects, the pin board, a public board, an article page, or login
- **THEN** the page renders with the ADAPTARIUM explorer theme

#### Scenario: Leaving the explorer
- **WHEN** a user goes from the explorer search page to the connected index through client-side navigation
- **THEN** the connected index renders without any ADAPTARIUM explorer theme colors

### Requirement: Explorer header stack
Every themed explorer page SHALL show the public-site top bar (ADAPTARIUM wordmark, EN / ES / IT, session control, menu button) and SHALL NOT show the previous site header. The search, projects, and pin board pages SHALL show the explorer project bar (project menu, project name, pins board button) directly below the top bar. The public board SHALL show a read-only project bar with the shared project's name. The menu button SHALL open the site navigation overlay.

#### Scenario: Header stack on the search page
- **WHEN** a user opens the explorer search page, projects, or the pin board
- **THEN** the public-site top bar is at the top, the project bar is directly below it, and the farclimate-logo site header is not shown

#### Scenario: Public board header
- **WHEN** a visitor opens a public board link
- **THEN** the public-site top bar is shown, and below it a project bar shows the shared project's name and a "view only" label without the project menu or pins board button

#### Scenario: Top bar only
- **WHEN** a user opens the explorer landing, an article page, or login
- **THEN** the public-site top bar is shown and neither the project bar nor the farclimate-logo site header is shown

#### Scenario: Menu opens overlay
- **WHEN** a user selects the menu button on the explorer search page
- **THEN** the site navigation overlay opens and marks the Solutions item as active

#### Scenario: Language switch keeps the page
- **WHEN** a user selects ES in the top bar on `/explorer/explorer`
- **THEN** the browser shows `/es/explorer/explorer`

### Requirement: Sticky filter sidebar clears the top bar
On a themed explorer page, the sticky filter sidebar SHALL stay below the sticky public-site top bar while the results scroll, and its full height SHALL remain scrollable within the viewport.

#### Scenario: Scrolling results
- **WHEN** a user scrolls down a long result list on the explorer search page
- **THEN** the top bar stays visible, the filter sidebar starts directly below it, and the last filter group can be scrolled into view

### Requirement: Explorer theme palette
A themed explorer page SHALL use the ADAPTARIUM palette: sand (`#eeeadf`) for the page and panel backgrounds, ink (`#2c2c2c`) for rules, borders, and primary text, and ADAPTARIUM blue (`#0f4fc4`) as the primary color for primary buttons, selected checkboxes, links, sector labels, and the selection action bars. Muted text SHALL be a lighter tint of ink that stays readable on sand.

#### Scenario: Backgrounds and rules
- **WHEN** a user opens the explorer search page
- **THEN** the page, the filter sidebar, and the result list background render sand, and their rules and borders render ink

#### Scenario: Primary actions
- **WHEN** a user views the project bar and the result list
- **THEN** the pins board button, selected result checkboxes, and sector labels render ADAPTARIUM blue

#### Scenario: Selection action bar
- **WHEN** results are selected on the explorer search page
- **THEN** the floating selection action bar renders ADAPTARIUM blue with light text

#### Scenario: Pin board and projects
- **WHEN** a user opens the pin board or the projects page
- **THEN** the page and board surfaces render sand or a lighter sand tint, rules render ink, and primary buttons render ADAPTARIUM blue

#### Scenario: Login
- **WHEN** a user opens login
- **THEN** the page background renders sand, the heading renders ink, and the submit button renders ADAPTARIUM blue

#### Scenario: Muted text contrast
- **WHEN** muted text such as result years, counts, or eyebrows renders on sand
- **THEN** it has a contrast ratio of at least 4.5:1 against the sand background

### Requirement: View-mode tab strip
On the explorer search page, the strip that switches between card, list, analyse, map, and bioregion views SHALL render on an ADAPTARIUM yellow (`#fdbe0f`) background with ink labels, and SHALL mark the active view with an ink underline and bold label.

#### Scenario: Active tab
- **WHEN** a user selects the list view
- **THEN** the tab strip is yellow, and the list tab shows an ink underline and a bold label while the other tabs do not

### Requirement: Solutions accent
A themed explorer page SHALL use ADAPTARIUM orange (`#fc4b08`), the Solutions section color, as its accent for the project bar mark, the rule beside the project name, and the switch and edge marker of an enabled filter group.

#### Scenario: Project bar accent
- **WHEN** a user opens a themed page that shows a project bar
- **THEN** the project mark and the rule beside the project name render orange

#### Scenario: Enabled filter group
- **WHEN** a user enables the climate impacts filter group
- **THEN** its switch and its left-edge marker render orange

### Requirement: Semantic colors in the theme
On a themed explorer page, the secondary, error, and warning colors SHALL use the ADAPTARIUM palette: secondary teal (`#249489`) with white text, error orange (`#fc4b08`) with ink text, and warning yellow (`#fdbe0f`) with ink text. This covers the sector, hazard, and adaptation-approach badges and any error or warning state on those pages.

#### Scenario: Taxonomy badges
- **WHEN** a user opens an article from the explorer search page or the pin board
- **THEN** the sector badge renders teal with white text, the hazard badge orange with ink text, and the adaptation-approach badges yellow with ink text

#### Scenario: Unthemed semantic colors unchanged
- **WHEN** a user opens an admin page
- **THEN** its secondary, error, and warning colors are the same as before this change

### Requirement: Theme reaches overlays and dialogs
The theme SHALL apply to everything a themed explorer page opens: the article side panel, the chat, insights, mind map, PowerPoint, podcast, comments, pin capture, and auth-required dialogs, dropdown menus, and tooltips.

#### Scenario: Article side panel
- **WHEN** a user opens an article from the result list
- **THEN** the side panel renders with sand surfaces, ink text, and blue links

#### Scenario: Chat dialog
- **WHEN** a user opens the chat from the selection action bar
- **THEN** the dialog uses the theme palette, and primary buttons in it render ADAPTARIUM blue

### Requirement: No leftover legacy colors
A themed explorer page SHALL NOT render the previous primary blue (`#1e63a2`), the previous near-black ink (`#100007`), the previous off-white (`#fffbf8`), or unthemed Tailwind gray, blue, sky, or slate utility colors in its chrome, results, filters, boards, panels, or dialogs. Data colors in charts and maps are exempt.

#### Scenario: Computed colors audit
- **WHEN** the computed text, background, and border colors of every visible element on each themed explorer page are collected, including every view mode of the search page
- **THEN** none equals `#1e63a2`, `#100007`, or `#fffbf8`, apart from chart and map data marks
