# Platform login and demo mode

Baseline access model: demo mode for unauthenticated visitors, authenticated sessions for signed-in users, login-gated persistence actions. Demo/authenticated UI is shown in the explorer (browser) header.

---

## ADDED Requirements

### Requirement: Demo users can access public platform flows without login

The platform SHALL treat visitors without a Supabase session as demo users and SHALL allow them to access public reading and exploration flows for public content without being required to authenticate first.

#### Scenario: Unauthenticated visitor opens a public page
- **WHEN** a visitor without an active session loads a public reading or exploration route
- **THEN** the platform SHALL render the route in demo mode and SHALL NOT require login before showing public content

#### Scenario: Demo user navigates through public exploration flows
- **WHEN** a demo user browses public content that does not create or update user-owned server data
- **THEN** the platform SHALL allow the interaction to continue without forcing authentication

### Requirement: Existing users can log in and restore authenticated sessions

The platform SHALL allow existing platform users to authenticate with Supabase Auth and SHALL restore authenticated sessions on subsequent page loads until the session is ended or expires.

#### Scenario: User logs in successfully
- **WHEN** a valid existing user completes the login flow
- **THEN** the platform SHALL transition from demo mode to authenticated mode in the active session

#### Scenario: Authenticated user reloads the application
- **WHEN** an authenticated user refreshes the app or opens a new page while their Supabase session remains valid
- **THEN** the platform SHALL restore the authenticated session and SHALL keep persistence-capable actions available without requiring a fresh login

### Requirement: Persistence actions are gated in demo mode

Any action that would create, update, or delete server-side user-owned data SHALL require an authenticated session. In demo mode, the platform SHALL block the write from proceeding and SHALL redirect the user to login or present a login gate before the action can continue.

#### Scenario: Demo user attempts a save-oriented action
- **WHEN** a demo user triggers an action that would persist user-owned data on the server
- **THEN** the platform SHALL prevent the server write and SHALL require login before the action can complete

#### Scenario: Authenticated user triggers a save-oriented action
- **WHEN** an authenticated user triggers an action that requires persistence
- **THEN** the platform SHALL allow the action to proceed without a demo-mode login block

### Requirement: The UI communicates whether the user is in demo mode or authenticated mode

The platform SHALL expose a consistent user-facing distinction between demo mode and authenticated mode so users can understand why public browsing is available without login and why persistence-related actions require authentication. This distinction SHALL be presented in the explorer (browser) header (the header used within the explorer/Solutions flow), not in the main site-wide header.

#### Scenario: Demo user encounters a login-gated action
- **WHEN** a demo user reaches a persistence-related entry point
- **THEN** the platform SHALL explain that the current session is in demo mode and that login is required for server-saved actions

#### Scenario: Authenticated user views the explorer header
- **WHEN** an authenticated user is using the explorer (Solutions flow)
- **THEN** the explorer header SHALL present signed-in state affordances (e.g. user email and Log out) consistent with an authenticated session rather than demo-mode messaging

#### Scenario: Demo user views the explorer header
- **WHEN** a demo user is using the explorer (Solutions flow)
- **THEN** the explorer header SHALL show demo mode indication and a Sign in control so the user can authenticate from within the explorer
