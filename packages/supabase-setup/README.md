# @farclimate/supabase-setup

One-time bootstrap pipeline for a brand-new Supabase environment.

This package is intentionally separate from `packages/db`:

- `packages/db` manages the regenerable `knowledge` domain and can be dropped/recreated repeatedly.
- `packages/supabase-setup` manages durable platform setup that should exist once per fresh Supabase project, such as auth/RBAC bootstrap and `human` domain ownership scaffolding.

## What it applies

The bootstrap runner executes every `.sql` file in `sql/` in lexical order.

Current setup includes:

1. `01_connected_admin_rbac.sql`
   - Creates the minimal application role model for elevated users only.
   - Creates `public.user_roles`.
   - Enables RLS and grants the minimum access needed for Supabase Auth to read assignments.

2. `02_connected_admin_auth_hook.sql`
   - Creates `public.is_connected_admin(uuid)`.
   - Creates `public.custom_access_token_hook(jsonb)`.
   - Creates `public.assign_connected_admin(...)` and `public.revoke_connected_admin(...)`.

3. `03_human_profiles.sql`
   - Creates durable schema `human`.
   - Creates `human.profiles` with one-to-one identity mapping to `auth.users(id)`.
   - Enables owner-only RLS (`id = auth.uid()`) for `select` and `update` to `authenticated`.
   - Creates an auth trigger/function so new auth users automatically get a profile row.
   - Includes validation checks to prevent `anon` access and broad cross-user policy mistakes.

4. `04_human_projects.sql`
   - Creates `human.projects` as the root workspace container with direct ownership (`owner_user_id` → `auth.users(id)`).
   - Enables owner-only RLS for `insert`, `select`, `update`, and `delete` so authenticated users can CRUD only their own projects.
   - Ensures `anon` has no project access; includes validation checks for policy shape.

5. `05_expose_human_schema.sql`
   - Exposes the `human` schema to the Supabase REST API (PostgREST). Without this, requests to `human.projects` or `human.profiles` return **406 Not Acceptable**. Run bootstrap at least once so list/create/update/delete from the frontend work.

## Usage

From the repo root:

```bash
pnpm supabase:bootstrap
```

Or directly:

```bash
cd packages/supabase-setup
pnpm bootstrap
```

The runner expects:

- `DATABASE_URL` in the repo root `.env`

## After the SQL finishes

The SQL creates the Postgres function used by Supabase Auth, but the hosted project still needs one dashboard configuration step:

1. Open Supabase Dashboard.
2. Go to `Authentication > Hooks`.
3. Set the Custom Access Token Hook to `public.custom_access_token_hook`.

Without that dashboard step, new JWTs will not include the `connected_admin` claim even though the function exists in the database.

At the same time, the bootstrap SQL provisions `human.profiles` and `human.projects`: authenticated users can persist profile metadata and preferences, and create/list/update/delete only their own projects, with ownership enforced by RLS.

## Managing elevated users

After a real auth user exists, grant elevated access with:

```sql
select public.assign_connected_admin('<auth-user-id>'::uuid);
```

To revoke it:

```sql
select public.revoke_connected_admin('<auth-user-id>'::uuid);
```

Changes to role assignments take effect on the next token refresh or next sign-in.

## Relationship to the knowledge pipeline

Run this bootstrap pipeline once when creating a new Supabase project.

After that, use the knowledge pipeline independently:

```bash
pnpm db:create
pnpm db:push
```

Those commands are safe to use repeatedly for the regenerable `knowledge` domain and do not replace this one-time environment bootstrap.
