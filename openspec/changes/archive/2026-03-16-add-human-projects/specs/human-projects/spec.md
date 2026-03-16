## ADDED Requirements

### Requirement: Human project setup is bootstrap reproducible
The system SHALL provision human-domain project infrastructure through `packages/supabase-setup` so a brand-new Supabase project can recreate the same project structure by running the setup pipeline.

#### Scenario: Bootstrap applies human project SQL in ordered setup
- **WHEN** operators run `pnpm supabase:bootstrap` on a new Supabase project
- **THEN** the setup pipeline MUST execute the human project SQL step and create required schema objects and access policies

#### Scenario: Setup documentation includes project provisioning
- **WHEN** engineers follow `packages/supabase-setup/README.md` for environment setup
- **THEN** the documented bootstrap flow MUST include human project provisioning and expected ownership behavior

### Requirement: Projects are directly owned by auth users
The system SHALL define `human.projects` with direct user ownership through `owner_user_id` referencing `auth.users(id)`, without requiring profile indirection for ownership.

#### Scenario: Project owner identity maps to auth user
- **WHEN** a project row is created
- **THEN** its `owner_user_id` MUST reference a valid `auth.users.id`

#### Scenario: Project cannot outlive deleted owner
- **WHEN** an auth user is deleted
- **THEN** owned project rows MUST be removed or made inaccessible according to ownership constraints

### Requirement: Authenticated users can create only own projects
The system SHALL allow authenticated users to create projects only when `owner_user_id` equals their own `auth.uid()`.

#### Scenario: Authenticated user creates own project
- **WHEN** an authenticated user inserts a project with `owner_user_id = auth.uid()`
- **THEN** the insert MUST succeed

#### Scenario: Authenticated user cannot create project for another user
- **WHEN** an authenticated user inserts a project with `owner_user_id != auth.uid()`
- **THEN** the insert MUST be denied by policy

### Requirement: Authenticated users can list and read only own projects
The system SHALL enforce row-level access so authenticated users can list and read only project rows they own.

#### Scenario: User can list own projects
- **WHEN** an authenticated user queries projects
- **THEN** only rows where `owner_user_id = auth.uid()` MUST be returned

#### Scenario: User cannot read another user's project
- **WHEN** an authenticated user requests a project row owned by a different user
- **THEN** the read MUST be denied by policy

### Requirement: Authenticated users can update and delete only own projects
The system SHALL enforce row-level access so authenticated users can update and delete only project rows they own.

#### Scenario: User updates own project
- **WHEN** an authenticated user updates a project row where `owner_user_id = auth.uid()`
- **THEN** the update MUST succeed

#### Scenario: User cannot update another user's project
- **WHEN** an authenticated user updates a project row owned by a different user
- **THEN** the update MUST be denied by policy

#### Scenario: User deletes own project
- **WHEN** an authenticated user deletes a project row where `owner_user_id = auth.uid()`
- **THEN** the delete MUST succeed

#### Scenario: User cannot delete another user's project
- **WHEN** an authenticated user deletes a project row owned by a different user
- **THEN** the delete MUST be denied by policy

### Requirement: Unauthenticated users have no project access
The system SHALL deny unauthenticated demo (`anon`) users from creating, listing, reading, updating, or deleting project rows.

#### Scenario: Anon cannot read projects
- **WHEN** an `anon` user attempts to query `human.projects`
- **THEN** access MUST be denied by policy

#### Scenario: Anon cannot mutate projects
- **WHEN** an `anon` user attempts to insert, update, or delete rows in `human.projects`
- **THEN** access MUST be denied by policy
