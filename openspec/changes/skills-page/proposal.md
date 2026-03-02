## Why

The platform needs a Skills section to surface practical learning resources (tools, courses, and real cases) that help users adapt to climate challenges. This page will be a browsable, filterable collection of skill cards that can later be powered by a CMS or Nuxt Content.

## What Changes

- New `skills.vue` page at `apps/web/app/pages/skills.vue`
- New `apps/web/app/components/skills/` folder containing:
  - `SkillsHero.vue` — full-bleed hero with background image, headline, and subtitle
  - `SkillsFilterSidebar.vue` — left sidebar with category checkboxes ("All trainings" + "Filter by")
  - `SkillCard.vue` — reusable card component with cover image, date, read time, title, description, and CTA button
  - `SkillsGrid.vue` — 2-column responsive grid that renders a list of `SkillCard` components
- Dummy static data in-component (structured to be replaceable by CMS/Nuxt Content later)
- Uses existing `default` layout (SiteHeader with `mode=true` + SiteFooter)

## Capabilities

### New Capabilities
- `skills-page`: Public-facing browsable skills/trainings catalog page with filter sidebar and card grid, matching the Figma handoff design (node 296-3285)

### Modified Capabilities

## Impact

- `apps/web/app/pages/skills.vue` — new file
- `apps/web/app/components/skills/` — new folder with 4 components
- `apps/web/app/assets/css/main.css` — no changes needed (design tokens already present)
- No new npm dependencies required (Nuxt UI + Tailwind already available)
