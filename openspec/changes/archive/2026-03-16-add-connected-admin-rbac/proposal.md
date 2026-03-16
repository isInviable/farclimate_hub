## Why

The platform needs a standard Supabase mechanism for granting a very small number of Connected Action editors elevated privileges without complicating the baseline access model for normal authenticated users. This is needed now so later RLS policies and frontend route checks can rely on a stable `connected_admin` authorization signal instead of ad hoc role checks.

## What Changes

- Introduce a dedicated `connected_admin` application role for elevated Connected Action editors.
- Add the supporting role-assignment model needed to associate specific authenticated users with the elevated role.
- Define a Custom Access Token Hook that injects the elevated role into Supabase JWT claims for assigned users.
- Establish the authorization contract that normal platform users remain plain `authenticated` users with no extra application role.
- Make elevated authorization available for later backend policy work and frontend route guards without changing Connected Action content policies in this step.

## Capabilities

### New Capabilities
- `connected-admin-rbac`: Elevated role assignment and JWT claim injection for Connected Action editors.

### Modified Capabilities
- None.

## Impact

- Affected Supabase auth configuration, JWT claim generation, and elevated-role assignment storage.
- Likely touches database migration files, auth hook implementation, and frontend access helpers or route guards that need to read elevated claims.
- Establishes the authorization foundation for later Connected Action editing permissions and RLS enforcement.
