## ADDED Requirements

### Requirement: Users always retain at least one owned project
The system SHALL prevent deletion of a project when it is the only project owned by that user.

#### Scenario: User cannot delete their last project
- **WHEN** an authenticated user attempts to delete a project row and that row is their only owned project
- **THEN** the delete MUST be rejected by the database

#### Scenario: User can delete a project when another owned project exists
- **WHEN** an authenticated user attempts to delete a project row and they own at least one other project
- **THEN** the delete MUST succeed subject to existing owner-only RLS policies

### Requirement: Default project is provisioned for new auth users
The system SHALL automatically create one default project per new auth user through the signup bootstrap path, without requiring a separate client-side create call.

#### Scenario: New user has one project without manual action
- **WHEN** a new auth user completes signup and queries their owned projects
- **THEN** exactly one project row MUST exist with `owner_user_id` equal to their user id

## MODIFIED Requirements

### Requirement: Authenticated users can update and delete only own projects
The system SHALL enforce row-level access so authenticated users can update and delete only project rows they own, and SHALL reject deletion when it would leave the user with zero owned projects.

#### Scenario: User updates own project
- **WHEN** an authenticated user updates a project row where `owner_user_id = auth.uid()`
- **THEN** the update MUST succeed

#### Scenario: User cannot update another user's project
- **WHEN** an authenticated user updates a project row owned by a different user
- **THEN** the update MUST be denied by policy

#### Scenario: User deletes own project when not the last
- **WHEN** an authenticated user deletes a project row where `owner_user_id = auth.uid()` and they own at least one other project
- **THEN** the delete MUST succeed

#### Scenario: User cannot delete their last owned project
- **WHEN** an authenticated user deletes a project row where `owner_user_id = auth.uid()` and it is their only owned project
- **THEN** the delete MUST be rejected

#### Scenario: User cannot delete another user's project
- **WHEN** an authenticated user deletes a project row owned by a different user
- **THEN** the delete MUST be denied by policy
