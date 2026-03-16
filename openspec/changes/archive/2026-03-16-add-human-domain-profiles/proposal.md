## Why

The platform needs a durable user-owned data domain that survives `knowledge` reloads and ties persisted records to authenticated identities. This setup must be reproducible in any brand-new Supabase project, so profile infrastructure needs to be part of the `packages/supabase-setup` bootstrap pipeline rather than a one-off manual migration.

## What Changes

- Add a new ordered SQL step in `packages/supabase-setup/sql/` to create `human` schema and `human.profiles`.
- Ensure `human.profiles` is one-to-one with `auth.users.id` as canonical identity.
- Include profile metadata fields for user-facing basics and a flexible JSON preferences field.
- Enforce RLS so authenticated users can only read/update their own profile and `anon` users have no access.
- Include deterministic profile bootstrap behavior (trigger/function) as part of setup when enabled by the SQL package flow.
- Update `packages/supabase-setup` documentation and bootstrap guidance so a fresh project can be provisioned end-to-end.

## Capabilities

### New Capabilities
- `human-profiles`: Human-domain user profile lifecycle, ownership, and access control linked to Supabase Auth.

### Modified Capabilities
- (none)

## Impact

- Affected systems: `packages/supabase-setup` SQL pipeline, durable Supabase schema setup, RLS policies, and auth-trigger bootstrap logic.
- Affected app code: auth/profile access composables and onboarding assumptions around profile row availability.
- Security impact: introduces first persistent human-domain table governed by `auth.uid()` ownership rules and provisioned through repeatable environment bootstrap.
