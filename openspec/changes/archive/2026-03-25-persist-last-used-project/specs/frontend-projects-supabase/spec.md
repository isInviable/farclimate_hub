## MODIFIED Requirements

### Requirement: Current project selection is consistent with Supabase data
The frontend SHALL maintain a notion of "current project" for the explorer/header and SHALL keep it consistent with the projects loaded from Supabase. On initialization, the system SHALL resolve the current project using a three-tier fallback: (1) localStorage cache, (2) `lastProjectId` from `human.profiles.preferences`, (3) the most-recently-updated project. On every project switch or creation, the system SHALL persist the selected project ID to both localStorage and `human.profiles.preferences`.

#### Scenario: Current project exists in list
- **WHEN** the user has a current project selected and the project list is loaded from Supabase
- **THEN** if the current project id exists in the list, it SHALL remain selected

#### Scenario: Current project no longer in list
- **WHEN** the loaded project list does not contain the previously selected current project id
- **THEN** the app SHALL clear the current selection or set it to the first available project

#### Scenario: First load with localStorage empty but profile preference set
- **WHEN** an authenticated user loads the explorer and localStorage has no stored project ID
- **AND** the user's `human.profiles.preferences.lastProjectId` contains a valid project ID
- **THEN** that project SHALL be selected as current
- **AND** localStorage SHALL be updated with that ID

#### Scenario: First load with both localStorage and profile preference empty
- **WHEN** an authenticated user loads the explorer and neither localStorage nor the profile contain a project ID
- **THEN** the most recently updated project SHALL be selected as current
- **AND** both localStorage and the profile preference SHALL be updated

#### Scenario: Project switch persists to profile
- **WHEN** an authenticated user switches to a different project
- **THEN** the selected project ID SHALL be written to both localStorage and `human.profiles.preferences.lastProjectId`

#### Scenario: Project creation persists to profile
- **WHEN** an authenticated user creates a new project
- **THEN** the new project's ID SHALL be set as current and persisted to both localStorage and `human.profiles.preferences.lastProjectId`
