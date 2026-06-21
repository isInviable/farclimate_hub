## ADDED Requirements

### Requirement: Profile bootstrap provisions default project on user creation
The system SHALL create exactly one default `human.projects` row for each new auth user as part of the profile bootstrap path, using the project name `"Default project"` and `owner_user_id` equal to the new user's `auth.users.id`.

#### Scenario: New auth user receives default project
- **WHEN** a new row is inserted into `auth.users`
- **THEN** the bootstrap logic MUST insert a `human.projects` row owned by that user with name `"Default project"`

#### Scenario: Default project triggers pinboard creation
- **WHEN** the bootstrap logic inserts the default project
- **THEN** the existing `human.projects` after-insert pinboard trigger MUST create exactly one `human.pinboards` row for that project

#### Scenario: Bootstrap remains idempotent for profile
- **WHEN** bootstrap logic is triggered more than once for the same auth user
- **THEN** the system MUST avoid duplicate profile rows (existing `on conflict do nothing` behavior preserved)

## MODIFIED Requirements

### Requirement: Profile bootstrap is deterministic when enabled
The system SHALL create a corresponding profile row exactly once per user when new auth users are created, and SHALL provision that user's first default project in the same bootstrap transaction path.

#### Scenario: Bootstrap creates missing profile on user creation
- **WHEN** a new auth user is created
- **THEN** a corresponding `human.profiles` row MUST be created for that user

#### Scenario: Bootstrap creates default project on user creation
- **WHEN** a new auth user is created
- **THEN** a default `human.projects` row MUST be created for that user

#### Scenario: Bootstrap remains idempotent
- **WHEN** bootstrap logic is triggered more than once for the same auth user
- **THEN** the system MUST avoid duplicate profile rows
