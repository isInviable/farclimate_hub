## ADDED Requirements

### Requirement: Explorer landing page matches editorial shell

The explorer index route SHALL use the same neutral / warm-neutral design tokens and layout vocabulary as the main explorer page (`bg-neutral-lightest`, bordered editorial surfaces, Nuxt UI controls). New markup SHALL NOT introduce ad hoc hex colors or arbitrary Tailwind spacing values when an equivalent theme utility exists.

#### Scenario: Landing renders without gray-* legacy utilities

- **WHEN** the explorer index page loads
- **THEN** primary backgrounds and text colors SHALL resolve through project neutral tokens (e.g. `neutral-*` / configured warm-neutral scales), not legacy `gray-*` palette classes used only on this page before the change

### Requirement: Landing content is internationalized

All user-visible strings on the explorer index page (headings, body copy, buttons, search placeholder, helper text, and page meta titles/descriptions exposed to Nuxt) SHALL be defined in the i18n locale files and referenced via `useI18n` / `$t`.

#### Scenario: Non-default locale

- **WHEN** the active UI locale is not English
- **THEN** the explorer index page SHALL display translated strings for every control and paragraph that was hard-coded English prior to this change

### Requirement: Shared styling extracted when duplicated

Repeated class bundles shared between the explorer index and other explorer surfaces SHALL be centralized in `app/assets/css/main.css` (`@layer components` or `@theme` aliases) or in Nuxt UI defaults in `app.config.ts`, following patterns already used on `explorer.vue`.

#### Scenario: Same card chrome in two pages

- **WHEN** the landing page uses a bordered content panel structurally equivalent to one on `explorer.vue`
- **THEN** both SHALL use the same shared utility class or component variant rather than copy-pasted unrelated Tailwind strings

### Requirement: Maintainable page structure

Self-contained sections of the explorer index (sector CTAs, introductory copy block, free-text search strip) SHALL be implemented as separate Vue components under `apps/web/app/components/` to keep `index.vue` small.

#### Scenario: Read index file

- **WHEN** a developer opens `pages/explorer/index.vue`
- **THEN** the file SHALL primarily compose layout and child components rather than contain all markup inline
