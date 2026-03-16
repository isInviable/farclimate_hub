## ADDED Requirements

### Requirement: Human profile setup is bootstrap reproducible
The system SHALL provision human-domain profile infrastructure through `packages/supabase-setup` so a brand-new Supabase project can recreate the same structure by running the setup pipeline.

#### Scenario: Bootstrap applies human profile SQL in ordered setup
- **WHEN** operators run `pnpm supabase:bootstrap` on a new Supabase project
- **THEN** the setup pipeline MUST execute the human profile SQL step and create required schema, table, policies, and bootstrap function/trigger definitions

#### Scenario: Setup documentation includes human profile provisioning
- **WHEN** engineers follow `packages/supabase-setup/README.md` for environment setup
- **THEN** the documented flow MUST include the human profile setup step and expected outcomes

### Requirement: Human domain profile identity mapping
The system SHALL provide a `human.profiles` record model that is one-to-one with Supabase Auth users, using `auth.users.id` as the canonical profile identity.

#### Scenario: Profile identity is anchored to auth user ID
- **WHEN** a profile row exists for a platform user
- **THEN** the profile primary identifier MUST equal that user's `auth.users.id`

#### Scenario: Profile cannot outlive deleted auth user
- **WHEN** an auth user is deleted
- **THEN** the corresponding `human.profiles` row MUST be removed or otherwise become inaccessible according to ownership rules

### Requirement: Profile supports basic metadata and flexible preferences
The system SHALL store profile information with stable user-facing metadata fields and an extensible preferences payload suitable for incremental product settings.

#### Scenario: Default preferences are available
- **WHEN** a profile is created without explicit preferences
- **THEN** the profile MUST expose a non-null default preferences object

#### Scenario: User metadata and preferences can be updated
- **WHEN** an authenticated owner updates allowed profile fields
- **THEN** the system MUST persist the updated metadata and preferences for that same profile

### Requirement: Profile access is owner-scoped for authenticated users only
The system SHALL enforce row-level security so authenticated users can read and update only their own profile, and unauthenticated demo (`anon`) users have no profile access.

#### Scenario: Authenticated owner can read own profile
- **WHEN** an authenticated user requests their own profile row
- **THEN** the request MUST succeed

#### Scenario: Authenticated user cannot read another user's profile
- **WHEN** an authenticated user requests a profile row owned by a different user
- **THEN** the request MUST be denied by policy

#### Scenario: Authenticated owner can update own profile
- **WHEN** an authenticated user updates their own profile
- **THEN** the update MUST succeed

#### Scenario: Authenticated user cannot update another user's profile
- **WHEN** an authenticated user updates a profile row owned by a different user
- **THEN** the update MUST be denied by policy

#### Scenario: Unauthenticated user has no profile access
- **WHEN** an `anon` user attempts to read or update any profile row
- **THEN** the request MUST be denied by policy

### Requirement: Profile bootstrap is deterministic when enabled
The system SHALL create a corresponding profile row exactly once per user when new auth users are created.

#### Scenario: Bootstrap creates missing profile on user creation
- **WHEN** a new auth user is created
- **THEN** a corresponding `human.profiles` row MUST be created for that user

#### Scenario: Bootstrap remains idempotent
- **WHEN** bootstrap logic is triggered more than once for the same auth user
- **THEN** the system MUST avoid duplicate profile rows
