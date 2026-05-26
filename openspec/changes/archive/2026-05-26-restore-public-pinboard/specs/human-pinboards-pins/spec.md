## ADDED Requirements

### Requirement: Pinboard share links are persisted with tokens
The system SHALL define a human-schema persistence model for public pinboard share links. Each share link SHALL reference one `human.projects` row, store a unique high-entropy token that is not the project UUID, support an enabled/disabled state, and cascade when the project is deleted.

#### Scenario: Share link references project
- **WHEN** a share link is created for a project
- **THEN** it SHALL reference the target `human.projects` row and be deleted when that project is deleted

#### Scenario: Share token is unique and non-project identifier
- **WHEN** a share link is created
- **THEN** its token SHALL be unique and SHALL NOT equal the project UUID

#### Scenario: Disabled or revoked share does not authorize public view
- **WHEN** a share link has `enabled = false` or a non-null `revoked_at`
- **THEN** the public board read path SHALL NOT return that project's pins for the token

### Requirement: Share link management is owner-only
The system SHALL allow authenticated project owners to create or reuse enabled share links for their own projects. Non-owners and unauthenticated users SHALL NOT create, list, update, delete, or otherwise manage share links through direct table access or application endpoints.

#### Scenario: Owner creates or reuses share link
- **WHEN** an authenticated project owner requests a public share link for their project
- **THEN** the system SHALL create a new enabled token or return an existing enabled token for that project

#### Scenario: Non-owner cannot create share link
- **WHEN** an authenticated user requests a public share link for a project they do not own
- **THEN** the request SHALL be denied

#### Scenario: Anon cannot manage share links
- **WHEN** an unauthenticated viewer attempts to manage share links
- **THEN** the operation SHALL be denied

### Requirement: Direct table access remains private
The system SHALL preserve the existing direct-access posture for `human.projects`, `human.pinboards`, and `human.pins`: browser clients using `anon` or non-owner authenticated sessions SHALL NOT directly read private project, pinboard, or pin rows. Public board viewing SHALL be mediated by application server endpoints that validate a share token and return a whitelisted read-only payload.

#### Scenario: Anon direct table access remains denied
- **WHEN** an `anon` client queries `human.projects`, `human.pinboards`, or `human.pins` directly
- **THEN** access SHALL remain denied by grants or RLS

#### Scenario: Public token read uses mediated payload
- **WHEN** any viewer opens a valid public board token
- **THEN** the application server SHALL resolve the token and return only the public board payload, not unrestricted table rows
