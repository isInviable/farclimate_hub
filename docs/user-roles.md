# User Roles

## Overview

The platform uses a minimal role model with three access states:

- `anon`: unauthenticated demo users
- `authenticated`: normal signed-in platform users
- `connected_admin`: a very small set of elevated users allowed to access Connected Action admin capabilities

Normal signed-in users do not receive a custom application role. They remain standard Supabase `authenticated` users.

## Why It Is Implemented This Way

This follows the intended Supabase pattern for application RBAC:

1. Store elevated role assignments in an application table.
2. Use a Custom Access Token Hook to copy the relevant role into the JWT.
3. Read that JWT claim in the frontend and, later, in RLS policies.

This approach was chosen because:

- it keeps baseline platform users simple
- it avoids inventing a custom role for every signed-in user
- it makes elevated access explicit and auditable
- it gives the frontend and database a shared source of truth through the JWT

## Source Of Truth

Elevated role assignments are stored in:

- `public.user_roles`

Only elevated users have a row in that table. If a normal authenticated user has no row, that is expected.

## How The JWT Gets The Role

The database function:

- `public.custom_access_token_hook(jsonb)`

is configured in Supabase Auth as the Custom Access Token Hook.

When a user signs in or refreshes their session:

- the hook checks `public.user_roles`
- if the user has the elevated assignment, it adds `connected_admin` to the JWT claims
- if the user does not have the assignment, no custom application role is added

## Important Implementation Detail

The extra role information is available in the JWT `access_token`, not necessarily in `session.user.app_metadata`.

For that reason, client-side access checks should read the decoded access token claims rather than relying only on the user object returned by Supabase Auth.

## Why There Is No Supabase UI For This

`public.user_roles` is application data, not a built-in Supabase roles product.

Supabase provides:

- auth users
- JWT hooks
- RLS
- database primitives

But the actual application role model belongs to the project. That is why role assignment is normally managed by:

- SQL
- scripts
- migrations
- or a custom internal admin UI

## Operational Notes

- Grant elevated access with `public.assign_connected_admin(...)`
- Revoke elevated access with `public.revoke_connected_admin(...)`
- After changing a role assignment, the user must sign in again or refresh their session to receive a new JWT

## Current Scope

This role setup only establishes elevated authorization for `connected_admin`.

It does not yet:

- create custom roles for normal platform users
- replace ownership-based access for the future human domain
- implement all future RLS policies for Connected Action content
