## ADDED Requirements

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
The frontend SHALL update (e.g. rename) and delete projects by calling Supabase to modify or remove rows in `human.projects`, and SHALL allow these actions only for authenticated users.

#### Scenario: Authenticated user renames a project
- **WHEN** an authenticated user renames a project
- **THEN** the app SHALL update the corresponding row in `human.projects` and SHALL refresh or update the in-memory list

#### Scenario: Authenticated user deletes a project
- **WHEN** an authenticated user deletes a project
- **THEN** the app SHALL delete the corresponding row in `human.projects` and SHALL refresh the list and clear current selection if the deleted project was current

#### Scenario: Demo user cannot update or delete projects
- **WHEN** a demo user attempts to rename or delete a project
- **THEN** the app SHALL redirect to login or show sign-in prompt and SHALL NOT perform the mutation

### Requirement: Current project selection is consistent with Supabase data
The frontend SHALL maintain a notion of “current project” for the explorer/header and SHALL keep it consistent with the projects loaded from Supabase (e.g. clear or fallback if the current project was deleted).

#### Scenario: Current project exists in list
- **WHEN** the user has a current project selected and the project list is loaded from Supabase
- **THEN** if the current project id exists in the list, it SHALL remain selected

#### Scenario: Current project no longer in list
- **WHEN** the loaded project list does not contain the previously selected current project id
- **THEN** the app SHALL clear the current selection or set it to the first available project

### Requirement: Projects Dashboard and DeliverableHeader use Supabase-backed data layer
The Projects Dashboard page and the DeliverableHeader component SHALL use the same Supabase-backed data layer for listing, creating, switching, renaming, and deleting projects, and SHALL not persist project list to localStorage.

#### Scenario: Dashboard shows Supabase-backed list
- **WHEN** an authenticated user opens the Projects Dashboard
- **THEN** the displayed projects SHALL come from Supabase and SHALL be the same as those available in the header dropdown

#### Scenario: Header dropdown shows same projects
- **WHEN** an authenticated user opens the project menu in DeliverableHeader
- **THEN** the list of projects SHALL come from the same source as the dashboard and SHALL support switch/create/rename/delete as per requirements above
