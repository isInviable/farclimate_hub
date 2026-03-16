## ADDED Requirements

### Requirement: Elevated Connected Action editors have explicit `connected_admin` role assignments
The platform SHALL provide a durable role-assignment model that can associate specific authenticated users with the `connected_admin` application role for elevated Connected Action authorization.

#### Scenario: Assigned user has an elevated role record
- **WHEN** an authenticated user is designated as a Connected Action editor
- **THEN** the platform SHALL persist an assignment that associates that user identity with the `connected_admin` application role

#### Scenario: Normal authenticated user has no elevated assignment
- **WHEN** an authenticated user has not been designated as a Connected Action editor
- **THEN** the platform SHALL treat that user as a baseline authenticated user without requiring any custom application role assignment

### Requirement: Assigned users receive `connected_admin` in their access token
The platform SHALL use a Supabase Custom Access Token Hook to inject the `connected_admin` authorization signal into the JWT for authenticated users who have an active elevated role assignment.

#### Scenario: Elevated user receives the connected_admin claim
- **WHEN** a user with an active `connected_admin` assignment obtains or refreshes a Supabase access token
- **THEN** the issued token SHALL include the `connected_admin` authorization signal needed for later backend and frontend checks

#### Scenario: Non-elevated user does not receive the connected_admin claim
- **WHEN** a baseline authenticated user without an active `connected_admin` assignment obtains or refreshes a Supabase access token
- **THEN** the issued token SHALL NOT include the `connected_admin` authorization signal

### Requirement: Elevated authorization is available without redefining baseline authenticated access
The platform SHALL make `connected_admin` detectable to shared authorization checks while preserving standard Supabase `authenticated` behavior for normal signed-in users.

#### Scenario: Frontend access check evaluates an elevated user
- **WHEN** shared frontend or middleware authorization logic evaluates a session whose token includes the `connected_admin` authorization signal
- **THEN** the logic SHALL be able to identify the session as elevated for Connected Action editing checks

#### Scenario: Frontend access check evaluates a normal authenticated user
- **WHEN** shared frontend or middleware authorization logic evaluates a session whose token does not include the `connected_admin` authorization signal
- **THEN** the logic SHALL continue to treat the user as a normal authenticated user rather than as an authorization failure
