# Spec Delta

## MODIFIED Requirements

### Requirement: Story article
Each of the four stories SHALL show the same Alfonso article. An unknown slug SHALL respond as not found, including the former kitchen-sink slug.

#### Scenario: Shared article
- **WHEN** a visitor opens `water-smart-agriculture-extremadura` and then `agriculture-adaptation-europe`
- **THEN** both pages show the same Alfonso article and neither shows "Content coming soon."

#### Scenario: Kitchen sink unchanged
- **WHEN** a visitor opens the kitchen-sink story in any locale
- **THEN** the response is not found and no component showcase is shown

#### Scenario: Missing story
- **WHEN** a visitor opens a story slug that has no content file
- **THEN** the response is not found
