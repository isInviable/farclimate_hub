## Context

The platform is introducing the first persistent `human` domain while preserving the current split from regenerable `knowledge` data. Identity remains anchored in `auth.users.id`, and all ownership checks should follow standard Supabase patterns (`auth.uid()` + RLS). This change must be fully reproducible for a brand-new Supabase project through `packages/supabase-setup`, which executes ordered SQL files in `sql/`.

## Goals / Non-Goals

**Goals:**
- Create a `human` schema for persistent user-owned tables.
- Define `human.profiles` as one row per auth user (`id uuid primary key` referencing `auth.users.id`).
- Support basic profile metadata plus flexible preferences (`jsonb`) without moving identity out of `auth.users`.
- Enforce least-privilege RLS: authenticated users can read/update only their own profile; unauthenticated users cannot access.
- Deliver the schema/RLS/bootstrap setup as part of `packages/supabase-setup` so it can be recreated on clean environments.
- Provide automatic profile bootstrap on auth user creation to reduce onboarding friction.

**Non-Goals:**
- Building all future human-domain tables (projects, pinboards, annotations) in this step.
- Introducing custom RBAC for normal user profile access.
- Exposing profile data to `anon` demo users.
- Coupling `human.profiles` to regenerable `knowledge` tables.
- Replacing `packages/db` workflows for regenerable knowledge data.

## Decisions

1. **Create a dedicated `human` schema now**
   - **Decision:** Add `create schema if not exists human` in bootstrap SQL.
   - **Rationale:** Makes domain boundaries explicit and keeps future persistent entities co-located.
   - **Alternative considered:** Keep `profiles` in `public`; rejected to avoid mixing domain concerns.

2. **Implement through `packages/supabase-setup/sql` ordered scripts**
   - **Decision:** Add a new numbered SQL file to the bootstrap package (for example, `03_human_profiles.sql`) so this setup is applied by `pnpm supabase:bootstrap`.
   - **Rationale:** Ensures reproducible, deterministic environment provisioning for new Supabase projects.
   - **Alternative considered:** Apply with a standalone one-time migration; rejected because it is easy to miss in new environments.

3. **Use `auth.users.id` as canonical profile identity**
   - **Decision:** `human.profiles.id uuid primary key references auth.users(id) on delete cascade`.
   - **Rationale:** Preserves Supabase-native identity ownership and avoids dual IDs.
   - **Alternative considered:** Independent profile UUID with unique FK to auth user; rejected as unnecessary indirection.

4. **Profile shape favors stable basics + flexible metadata**
   - **Decision:** Include stable columns (`display_name`, `avatar_url`, timestamps) plus `preferences jsonb not null default '{}'::jsonb`.
   - **Rationale:** Supports early product needs while avoiding frequent schema churn for user settings.
   - **Alternative considered:** Fully normalized preferences tables; postponed until concrete requirements exist.

5. **RLS ownership uses direct `auth.uid()` checks**
   - **Decision:** Enable RLS and create policies for `select` and `update` where `id = auth.uid()`; no `insert` policy for clients by default.
   - **Rationale:** Matches preferred implementation style and minimizes privilege surface.
   - **Alternative considered:** View-based access wrappers; unnecessary for this scope.

6. **Bootstrap strategy is trigger-backed inside setup SQL**
   - **Decision:** Add an `auth.users` insert trigger/function in setup SQL to upsert into `human.profiles`.
   - **Rationale:** Guarantees row presence for authenticated users and simplifies app-level assumptions.
   - **Alternative considered:** First-login client-side insert; rejected as race-prone and dependent on frontend execution.

## Risks / Trade-offs

- **[Trigger coupling to auth schema]** Supabase-managed schema internals can evolve. → **Mitigation:** Keep trigger function minimal, idempotent (`insert ... on conflict do nothing`), and isolated in one migration.
- **[JSON preferences drift]** Unstructured settings may become inconsistent. → **Mitigation:** Store only non-critical optional preferences initially and add application-level validation for known keys.
- **[Bootstrap ordering errors]** SQL dependency order may break if files are misnumbered. → **Mitigation:** Keep one clearly numbered setup file and document ordering assumptions in README.
- **[Delete cascade implications]** Deleting auth user removes profile. → **Mitigation:** Align with expected account deletion semantics and document behavior.

## Migration Plan

1. Add a numbered SQL bootstrap file in `packages/supabase-setup/sql/` that creates schema, table, indexes, and grants required for authenticated access with RLS.
2. Enable RLS and apply owner-only `select`/`update` policies.
3. Add auth trigger function + trigger to bootstrap profile on user creation.
4. Validate with SQL checks:
   - authenticated user can read/update own profile,
   - authenticated user cannot read/update another user profile,
   - anon role has no access.
5. Update `packages/supabase-setup/README.md` so running `pnpm supabase:bootstrap` on a new project includes human profile provisioning expectations.
6. Rollback strategy:
   - drop trigger/function (if created),
   - drop policies/table/schema in reverse dependency order.

## Open Questions

- Which profile fields are required now beyond `display_name` and `preferences`?
- Do we need audit metadata for profile updates in this initial version?
