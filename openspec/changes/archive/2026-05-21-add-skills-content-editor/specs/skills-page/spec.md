## ADDED Requirements

### Requirement: Skill detail pages render published skill content
The system SHALL provide a localized public detail page for each published skill that renders shared skill fields plus localized title and content. Shared fields SHALL include header image, tags, and external links. Localized fields SHALL include title, markdown body, and summary derived from the `<!-- more -->` marker.

#### Scenario: Published skill detail page is available
- **WHEN** a user visits the detail URL for a published skill
- **THEN** the page SHALL display the skill content including header image, tags, summary, rendered markdown body, and external links

#### Scenario: Unpublished skill detail page is not available
- **WHEN** a user visits the detail URL for an unpublished or missing skill
- **THEN** the system SHALL return a not found response

#### Scenario: Locale-specific skill detail is requested
- **WHEN** a user visits a skill detail page in English, Spanish, or Italian
- **THEN** the page SHALL load the shared published skill fields and the active locale's title and markdown body

### Requirement: Skills page filters by Supabase tags
The page SHALL allow users to filter published skills by one-level tags loaded from Supabase with labels localized to English, Spanish, and Italian.

#### Scenario: User selects a tag filter
- **WHEN** a user selects a visible tag in the skills sidebar
- **THEN** the grid SHALL show only published skills assigned to that tag

#### Scenario: User clears tag filters
- **WHEN** a user clears all selected tag filters
- **THEN** the grid SHALL show all published skills available for the current locale

## MODIFIED Requirements

### Requirement: Skills page renders a filter sidebar
The page SHALL display a left sidebar with tag filters loaded from the published skills taxonomy and simple filter options that match the current skills browsing experience.

#### Scenario: Tag checkboxes are visible
- **WHEN** the skills page renders with published skills content
- **THEN** the sidebar SHALL show one-level skill tags with localized labels and counts derived from published skills

#### Scenario: Filter by checkboxes are visible
- **WHEN** the skills page renders
- **THEN** the sidebar SHALL show supported browsing filters such as More views, Relevance, or other configured options

### Requirement: Skills page renders a grid of skill cards
The page SHALL display a grid of `SkillCard` components populated from published Supabase skills joined with localized title and content for the active locale to the right of the sidebar.

#### Scenario: Cards display required fields
- **WHEN** the skills grid renders published skills
- **THEN** each card SHALL show a cover image, publication date or equivalent display date, read time when available, title, summary excerpt, localized tags, and a "Read" CTA button

#### Scenario: Empty published skills state
- **WHEN** no published skills match the current filters
- **THEN** the page SHALL display an empty state instead of placeholder dummy cards

### Requirement: SkillCard is a reusable component
`SkillCard.vue` SHALL accept a typed skill item prop and SHALL NOT duplicate markup between instances.

#### Scenario: SkillCard renders from prop data
- **WHEN** `SkillCard` is given a published skill item prop
- **THEN** it SHALL render the item's image, date or read-time metadata, title, summary, tags, and a link to the skill detail page

### Requirement: Dummy data is typed and swappable
The skills data layer SHALL expose a typed interface compatible with the public skills components while loading published skills and tag metadata from Supabase instead of static placeholder data.

#### Scenario: Data interface has required fields
- **WHEN** a skill item is loaded for public display
- **THEN** it SHALL include id, locale, slug, title, summary, image, date or publication metadata, read time when available, detail URL, and assigned tags
