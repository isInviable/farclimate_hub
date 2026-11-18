# Spec Delta

## MODIFIED Requirements

### Requirement: Existing header preserved elsewhere
Pages not adopting the new design (admin, and pages still on the default layout) SHALL keep their current header unchanged. The about page adopts the public-site top bar and footer and is not part of this exception. Connected pages adopt the public-site top bar and are not part of this exception. Explorer pages, article pages, and login adopt the public-site top bar and are not part of this exception.

#### Scenario: Explorer header
- **WHEN** a user opens any explorer page, an article page, or login
- **THEN** the page shows the public-site top bar and does not show the previous site header

#### Scenario: About top bar
- **WHEN** a user opens the about page
- **THEN** the page shows the public-site top bar and the site footer and does not show the previous site header

#### Scenario: Default layout header
- **WHEN** a user opens a page that still uses the default layout
- **THEN** the page shows the same header as before the change

#### Scenario: Connected top bar
- **WHEN** a user opens the connected index or the connected dashboard
- **THEN** the page shows the public-site top bar and does not show the previous site header
