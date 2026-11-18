# Spec Delta

## MODIFIED Requirements

### Requirement: Existing header preserved elsewhere
Pages not adopting the new design (explorer, article, admin, and pages still on the default layout) SHALL keep their current header unchanged. Connected pages adopt the public-site top bar and are not part of this exception.

#### Scenario: Explorer header
- **WHEN** a user opens the explorer after the change
- **THEN** the explorer shows the same header as before the change

#### Scenario: Connected top bar
- **WHEN** a user opens the connected index or the connected dashboard
- **THEN** the page shows the public-site top bar and does not show the previous site header
