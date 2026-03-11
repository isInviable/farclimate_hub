## ADDED Requirements

### Requirement: Skills page renders hero section
The page SHALL display a full-width hero section with a background image, dark gradient overlay, a large heading, and a subtitle paragraph. The header navigation SHALL be transparent and overlaid on the hero.

#### Scenario: Hero displays headline and subtitle
- **WHEN** a user visits `/skills`
- **THEN** the hero section SHALL show the heading "Learn the skills to adapt and thrive in a changing climate" and the subtitle text

#### Scenario: Hero uses transparent navigation overlay
- **WHEN** the skills page loads
- **THEN** the `SiteHeader` SHALL be rendered in overlay mode (`mode=true`) so it sits on top of the hero image

### Requirement: Skills page renders a filter sidebar
The page SHALL display a left sidebar with two filter groups: "All trainings" (category checkboxes) and "Filter by" (sort/relevance checkboxes).

#### Scenario: All trainings checkboxes are visible
- **WHEN** the skills page renders
- **THEN** the sidebar SHALL show checkboxes for: Forestry, Fisheries, Agriculture, Life Cycle Assessment, EU Taxonomy, Biodiversity, Nature-Based solutions with their counts

#### Scenario: Filter by checkboxes are visible
- **WHEN** the skills page renders
- **THEN** the sidebar SHALL show checkboxes for: More views, Relevance, Agriculture

### Requirement: Skills page renders a grid of skill cards
The page SHALL display a 2-column grid of `SkillCard` components to the right of the sidebar.

#### Scenario: Cards display required fields
- **WHEN** the skills grid renders
- **THEN** each card SHALL show: a cover image, publication date, read time, title, description excerpt, and a "Read" CTA button

#### Scenario: Minimum cards shown
- **WHEN** the page loads with dummy data
- **THEN** at least 4 skill cards SHALL be visible in a 2-column layout

### Requirement: SkillCard is a reusable component
`SkillCard.vue` SHALL accept a single typed prop (`item: SkillItem`) and SHALL NOT duplicate markup between instances.

#### Scenario: SkillCard renders from prop data
- **WHEN** `SkillCard` is given a `SkillItem` prop
- **THEN** it SHALL render the item's image, date, readTime, title, description, and a link to the item's url

### Requirement: Dummy data is typed and swappable
The skills data SHALL be defined as a typed `SkillItem[]` array in `composables/useSkillsData.ts` so it can be replaced by a CMS call without changing component interfaces.

#### Scenario: Data interface has required fields
- **WHEN** a `SkillItem` is defined
- **THEN** it SHALL include: id, title, description, image, date, readTime, url, and categories fields
