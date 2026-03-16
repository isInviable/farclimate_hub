## Why

Authenticated platform users need their first concrete server-side persistence capability in the `human` domain so saved work is durable and isolated per user. A minimal `human.projects` root container unlocks future curation features while being independently useful now.

## What Changes

- Add `human.projects` as the root workspace container for user-owned data.
- Model ownership directly with `owner_user_id references auth.users(id)`, not through `human.profiles`.
- Enforce ownership-based RLS so authenticated users can create, list, update, and delete only their own projects.
- Ensure `anon` users cannot create, read, update, or delete projects.
- Integrate schema and RLS setup into `packages/supabase-setup` so new Supabase environments can be recreated consistently.

## Capabilities

### New Capabilities
- `human-projects`: User-owned project persistence with direct auth-user ownership and CRUD policies.

### Modified Capabilities
- (none)

## Impact

- Affected systems: `packages/supabase-setup` SQL bootstrap flow and durable `human` schema structures.
- Affected app code: future project APIs/composables and UI flows that list/create/update/delete user projects.
- Security impact: introduces owner-scoped CRUD access controls for the first user workspace entity.
