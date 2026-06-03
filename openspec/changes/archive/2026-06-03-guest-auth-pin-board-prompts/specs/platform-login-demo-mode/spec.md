## MODIFIED Requirements

### Requirement: Persistence actions are gated in demo mode

Any action that would create, update, or delete server-side user-owned data SHALL require an authenticated session. In demo mode, the platform SHALL block the write from proceeding. For **user-initiated interactive entry points** in the explorer (pin capture, private pinboard navigation from the header), the platform SHALL present an auth-required modal with explanatory copy and actions to log in/register or cancel before any persistence dialog or navigation proceeds. For **direct navigation** to the private pinboard route without a session, the platform SHALL redirect to login with a `returnTo` parameter. Other persistence actions MAY continue to use redirect-based gating via `requireAuthForPersistence` until migrated.

#### Scenario: Demo user attempts a save-oriented action via pin affordance

- **WHEN** a demo user clicks a pin capture control in the explorer
- **THEN** the platform SHALL open an auth-required modal explaining that the pinboard saves content for future analysis or sharing
- **AND** the platform SHALL NOT open the pin capture dialog until the user is authenticated
- **AND** canceling the modal SHALL leave the user on the current explorer view

#### Scenario: Demo user accepts auth prompt from pin affordance

- **WHEN** a demo user clicks Log in / Register on the pin auth modal
- **THEN** the platform SHALL navigate to `/login?returnTo=<current path>`

#### Scenario: Demo user attempts direct access to private pinboard URL

- **WHEN** a demo user navigates directly to `/explorer/board` (typed URL, bookmark, or external link)
- **THEN** the platform SHALL redirect to `/login?returnTo=/explorer/board`
- **AND** the platform SHALL NOT render the private pinboard empty state

#### Scenario: Authenticated user triggers a save-oriented action

- **WHEN** an authenticated user triggers an action that requires persistence
- **THEN** the platform SHALL allow the action to proceed without a demo-mode login block

### Requirement: The UI communicates whether the user is in demo mode or authenticated mode

The platform SHALL expose a consistent user-facing distinction between demo mode and authenticated mode so users can understand why public browsing is available without login and why persistence-related actions require authentication. This distinction SHALL be presented in the explorer (browser) header (the header used within the explorer/Solutions flow), not in the main site-wide header. Pin and private pinboard affordances SHALL remain visible to demo users; auth messaging SHALL appear at interaction time via the auth-required modal rather than by hiding controls.

#### Scenario: Demo user encounters a login-gated pin action

- **WHEN** a demo user clicks a pin capture control
- **THEN** the platform SHALL explain via modal that login is required to save to a personal pinboard
- **AND** the platform SHALL offer Log in / Register and Cancel actions

#### Scenario: Demo user encounters private pinboard navigation from header

- **WHEN** a demo user clicks the private pinboard control in the explorer header
- **THEN** the platform SHALL explain via modal that login is required to view and manage their pinboard
- **AND** the platform SHALL NOT navigate to `/explorer/board` unless the user authenticates or the modal is dismissed

#### Scenario: Authenticated user views the explorer header

- **WHEN** an authenticated user is using the explorer (Solutions flow)
- **THEN** the explorer header SHALL present signed-in state affordances (e.g. user email and Log out) consistent with an authenticated session rather than demo-mode messaging

#### Scenario: Demo user views the explorer header

- **WHEN** a demo user is using the explorer (Solutions flow)
- **THEN** the explorer header SHALL show demo mode indication and a Sign in control so the user can authenticate from within the explorer

## ADDED Requirements

### Requirement: Auth prompt API is available for persistence gates

The platform SHALL expose a reusable client-side auth prompt API (e.g. `promptAuthForPersistence(context)`) that returns `true` when the user is authenticated and `false` when a demo user is shown the auth-required modal. The API SHALL support at least `pin` and `board` contexts with distinct localized title and body copy. The modal SHALL be mountable once in the explorer layout and invokable from any descendant component without duplicating modal markup.

#### Scenario: Authenticated caller receives immediate success

- **WHEN** an authenticated user triggers `promptAuthForPersistence` for any context
- **THEN** the function SHALL return `true` without opening a modal

#### Scenario: Demo caller opens modal and returns false

- **WHEN** a demo user triggers `promptAuthForPersistence('pin')`
- **THEN** the auth-required modal SHALL open with pin-context copy
- **AND** the function SHALL return `false` until the user authenticates (modal does not auto-complete the original action after login in this change)

#### Scenario: Modal cancel dismisses without navigation

- **WHEN** a demo user clicks Cancel on the auth-required modal
- **THEN** the modal SHALL close
- **AND** the user SHALL remain on the current page with no login redirect
