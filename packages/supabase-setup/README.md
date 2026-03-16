# @farclimate/supabase-setup

One-time bootstrap pipeline for a brand-new Supabase environment.

This package is intentionally separate from `packages/db`:

- `packages/db` manages the regenerable `knowledge` domain and can be dropped/recreated repeatedly.
- `packages/supabase-setup` manages durable platform setup that should exist once per fresh Supabase project, such as auth/RBAC bootstrap for `connected_admin`.

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
