## ADDED Requirements

### Requirement: Last-project delete shows friendly error
When the database rejects deletion of the user's last project, the frontend SHALL display a localized, user-friendly error message instead of a generic failure or raw database error text.

#### Scenario: Delete last project shows localized message
- **WHEN** an authenticated user attempts to delete their only remaining project
- **AND** Supabase returns an error from the last-project delete guard
- **THEN** the app SHALL surface a localized message explaining that at least one project must remain
- **AND** the app SHALL NOT show a generic or raw Postgres error string to the user

## MODIFIED Requirements

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
