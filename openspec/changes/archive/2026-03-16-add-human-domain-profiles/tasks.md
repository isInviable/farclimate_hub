## 1. Supabase setup pipeline integration

- [x] 1.1 Add a new ordered SQL file in `packages/supabase-setup/sql/` (next numeric prefix) for human profile provisioning.
- [x] 1.2 In that SQL file, create schema `human` and define `human.profiles` with `id uuid primary key references auth.users(id) on delete cascade`, metadata columns, `preferences jsonb not null default '{}'::jsonb`, and timestamps.
- [x] 1.3 Confirm the new SQL file is picked up by the bootstrap runner (`listSqlFiles` lexical order) and executes successfully via `pnpm supabase:bootstrap`.

## 2. Access control and ownership enforcement

- [x] 2.1 Enable RLS on `human.profiles`.
- [x] 2.2 Add owner-only `select` policy using `id = auth.uid()`.
- [x] 2.3 Add owner-only `update` policy using `id = auth.uid()`.
- [x] 2.4 Verify there is no `anon` access path and no broad authenticated policy that allows cross-user reads/updates.

## 3. Deterministic profile bootstrap behavior

- [x] 3.1 Implement auth-user bootstrap function and trigger in setup SQL that creates a profile row for new `auth.users` records.
- [x] 3.2 Ensure bootstrap logic is idempotent (no duplicate profile row on repeated trigger execution).
- [x] 3.3 Verify trigger/function naming and permissions are compatible with existing `packages/supabase-setup` auth hook setup.

## 4. Validation and documentation

- [x] 4.1 Add SQL validation checks proving owner can read/update own profile and cannot read/update another user profile.
- [x] 4.2 Add validation showing `anon` cannot read or update `human.profiles`.
- [x] 4.3 Update `packages/supabase-setup/README.md` with the human profile bootstrap step and expected post-bootstrap state.
- [x] 4.4 Update relevant docs for the new `human` domain profile model and ownership expectations.
