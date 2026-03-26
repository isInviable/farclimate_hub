## ADDED Requirements

### Requirement: Read user preferences from profile
The system SHALL provide a composable that reads the `preferences` JSONB from `human.profiles` for the authenticated user.

#### Scenario: Authenticated user reads preferences
- **WHEN** an authenticated user's code calls `getPreferences()`
- **THEN** the system returns the parsed JSONB object from `human.profiles.preferences` for that user

#### Scenario: Empty preferences returns default object
- **WHEN** the user's profile has `preferences = '{}'`
- **THEN** the system returns an empty object `{}`

#### Scenario: Unauthenticated user gets null
- **WHEN** a demo (unauthenticated) user's code calls `getPreferences()`
- **THEN** the system returns `null` without making a database query

---

### Requirement: Write user preferences to profile
The system SHALL provide a composable method to merge a partial preferences object into the existing `human.profiles.preferences` JSONB for the authenticated user.

#### Scenario: Update a single preference key
- **WHEN** an authenticated user's code calls `setPreference('lastProjectId', '<uuid>')`
- **THEN** the `preferences` JSONB on `human.profiles` SHALL be updated with `lastProjectId` set to the given value, preserving all other existing keys

#### Scenario: Unauthenticated user write is no-op
- **WHEN** a demo user's code calls `setPreference()`
- **THEN** no database query is made and the call returns without error

---

### Requirement: Preference writes are non-blocking
Writes to `human.profiles.preferences` SHALL be fire-and-forget from the caller's perspective. Failures SHALL be logged to the console but SHALL NOT block UI interactions or throw user-visible errors.

#### Scenario: Network failure on preference write
- **WHEN** a preference write fails due to a network error
- **THEN** the error is logged to the console
- **AND** the calling code continues execution without interruption
