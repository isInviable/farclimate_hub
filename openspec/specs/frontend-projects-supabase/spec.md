## Requirements

### Requirement: Projects list comes from Supabase when authenticated
The frontend SHALL load the list of projects from Supabase `human.projects` when the user is authenticated, and SHALL not expose project list from the database to unauthenticated (demo) users.

#### Scenario: Authenticated user sees own projects
- **WHEN** the user is signed in and opens the Projects Dashboard or the header project dropdown
- **THEN** the list of projects SHALL be fetched from `human.projects` and SHALL reflect only rows owned by that user (RLS enforced server-side)

#### Scenario: Demo user sees no projects from database
- **WHEN** the user is in demo mode (not signed in)
- **THEN** the app SHALL NOT request project list from Supabase and SHALL show an empty or sign-in-prompt state for projects

### Requirement: Create project uses Supabase and requires auth
The frontend SHALL create new projects by inserting into `human.projects` via the Supabase client, and SHALL allow creation only for authenticated users.

#### Scenario: Authenticated user creates a project
- **WHEN** an authenticated user submits a new project name (e.g. from dashboard or header)
- **THEN** the app SHALL insert a row into `human.projects` with `owner_user_id` set to the current user and SHALL refresh the project list

#### Scenario: Demo user cannot create a project
- **WHEN** a demo user attempts to create a project
- **THEN** the app SHALL redirect to login (or prompt sign-in) and SHALL NOT insert into Supabase

### Requirement: Update and delete project use Supabase and require auth
The frontend SHALL update (e.g. rename) and delete projects by calling Supabase to modify or remove rows in `human.projects`, and SHALL allow these actions only for authenticated users. When delete is rejected because the project is the user's last owned project, the frontend SHALL present a friendly localized error.

#### Scenario: Authenticated user renames a project
- **WHEN** an authenticated user renames a project
- **THEN** the app SHALL update the corresponding row in `human.projects` and SHALL refresh or update the in-memory list

#### Scenario: Authenticated user deletes a project
- **WHEN** an authenticated user deletes a project and they own at least one other project
- **THEN** the app SHALL delete the corresponding row in `human.projects` and SHALL refresh the list and clear current selection if the deleted project was current

#### Scenario: Authenticated user cannot delete last project
- **WHEN** an authenticated user attempts to delete their only remaining project
- **THEN** the app SHALL NOT remove the project row
- **AND** the app SHALL show a localized error that at least one project must remain

#### Scenario: Demo user cannot update or delete projects
- **WHEN** a demo user attempts to rename or delete a project
- **THEN** the app SHALL redirect to login or show sign-in prompt and SHALL NOT perform the mutation

### Requirement: Last-project delete shows friendly error
When the database rejects deletion of the user's last project, the frontend SHALL display a localized, user-friendly error message instead of a generic failure or raw database error text.

#### Scenario: Delete last project shows localized message
- **WHEN** an authenticated user attempts to delete their only remaining project
- **AND** Supabase returns an error from the last-project delete guard
- **THEN** the app SHALL surface a localized message explaining that at least one project must remain
- **AND** the app SHALL NOT show a generic or raw Postgres error string to the user

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

### Requirement: Projects Dashboard and DeliverableHeader use Supabase-backed data layer
The Projects Dashboard page and the DeliverableHeader component SHALL use the same Supabase-backed data layer for listing, creating, switching, renaming, and deleting projects, and SHALL not persist project list to localStorage.

#### Scenario: Dashboard shows Supabase-backed list
- **WHEN** an authenticated user opens the Projects Dashboard
- **THEN** the displayed projects SHALL come from Supabase and SHALL be the same as those available in the header dropdown

#### Scenario: Header dropdown shows same projects
- **WHEN** an authenticated user opens the project menu in DeliverableHeader
- **THEN** the list of projects SHALL come from the same source as the dashboard and SHALL support switch/create/rename/delete as per requirements above
