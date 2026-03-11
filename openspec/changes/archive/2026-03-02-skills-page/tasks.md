## 1. Data Layer

- [x] 1.1 Create `apps/web/app/composables/useSkillsData.ts` with `SkillItem` interface and dummy data array (4+ items with image, date, readTime, title, description, url, categories)

## 2. Components

- [x] 2.1 Create `apps/web/app/components/skills/SkillsHero.vue` — full-bleed hero with background image, gradient overlay, heading, and subtitle
- [x] 2.2 Create `apps/web/app/components/skills/SkillCard.vue` — reusable card with cover image, date, readTime, title, description, and "Read" CTA button accepting `item: SkillItem` prop
- [x] 2.3 Create `apps/web/app/components/skills/SkillsGrid.vue` — 2-column grid that renders `SkillCard` from an `items: SkillItem[]` prop
- [x] 2.4 Create `apps/web/app/components/skills/SkillsFilterSidebar.vue` — sidebar with "All trainings" and "Filter by" checkbox groups using `UCheckbox`

## 3. Page

- [x] 3.1 Create `apps/web/app/pages/skills.vue` — orchestration page using `default` layout, importing `useSkillsData`, and composing `SkillsHero`, `SkillsFilterSidebar`, and `SkillsGrid`
- [x] 3.2 Update `SiteHeader` Skills nav link `to` prop to point to `/skills`

## 4. Verification

- [x] 4.1 Verify page renders at `/skills` with all sections visible
- [x] 4.2 Verify no TypeScript or linter errors
