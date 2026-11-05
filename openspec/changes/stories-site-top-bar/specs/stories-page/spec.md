# Spec Delta

## MODIFIED Requirements

### Requirement: Stories index route
The site SHALL serve the stories index at `/stories`, `/es/stories`, and `/it/stories`. The index SHALL show the public-site top bar above the poster: the wordmark, the language switcher, the session control, and the hamburger.

#### Scenario: Open the index
- **WHEN** a visitor opens `/stories`
- **THEN** the poster is shown and the previous card list is not

#### Scenario: Index top bar
- **WHEN** a visitor opens `/es/stories`
- **THEN** the top bar is above the poster and shows the wordmark, the language switcher, the session control, and the hamburger

### Requirement: Story article
Each of the four stories SHALL show the same Alfonso article. An unknown slug SHALL respond as not found, including the former kitchen-sink slug. Each story article SHALL show the same public-site top bar above the article.

#### Scenario: Shared article
- **WHEN** a visitor opens `water-smart-agriculture-extremadura` and then `agriculture-adaptation-europe`
- **THEN** both pages show the same Alfonso article and neither shows "Content coming soon."

#### Scenario: Kitchen sink unchanged
- **WHEN** a visitor opens the kitchen-sink story in any locale
- **THEN** the response is not found and no component showcase is shown

#### Scenario: Missing story
- **WHEN** a visitor opens a story slug that has no content file
- **THEN** the response is not found

#### Scenario: Article top bar
- **WHEN** a visitor opens a story article
- **THEN** the top bar is above the article and shows the wordmark, the language switcher, the session control, and the hamburger
