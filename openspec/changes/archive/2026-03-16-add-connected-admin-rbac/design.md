## Context

The platform access model already distinguishes unauthenticated demo users, normal authenticated users, and a very small set of elevated Connected Action editors. This change introduces only the elevated authorization mechanism for those editors. It must fit standard Supabase patterns so ownership-based access in the future `human` domain continues to rely on `auth.uid()` and baseline `authenticated` sessions, while elevated Connected Action permissions come from a distinct RBAC path.

This is a cross-cutting auth change because it affects database role-assignment storage, Supabase JWT claim generation, and frontend or middleware access checks that will later protect Connected Action editing routes. The design should stay minimal and avoid creating custom roles for ordinary signed-in users.

## Goals / Non-Goals

**Goals:**
- Introduce a minimal RBAC model for the `connected_admin` role.
- Allow specific authenticated users to be assigned the elevated role through a durable role-assignment table.
- Inject the elevated role into the Supabase access token for assigned users using a Custom Access Token Hook.
- Make the elevated signal available to backend policy checks and frontend route guards without changing Connected Action content policies yet.
- Preserve the rule that normal platform users remain standard Supabase `authenticated` users unless explicitly elevated.

**Non-Goals:**
- Creating a custom application role for all authenticated platform users.
- Implementing Connected Action table RLS or write policies in this change.
- Building full Connected Action authoring UI flows.
- Redesigning the baseline demo-versus-authenticated access model.

## Decisions

### 1. Use a dedicated application-role assignment table for elevated users only

The system will store explicit elevated-role assignments in a small table keyed by the authenticated user identifier and the application role value. This keeps role management auditable and avoids overloading user profile data with authorization concerns.

Only elevated users need entries in this table. Normal authenticated users will have no application-role row and will continue to rely on baseline Supabase auth state plus ownership-based checks.

Alternatives considered:
- Add a role column directly to a profile table. Rejected because profiles belong to the user-data model and may not exist yet for every authenticated user.
- Assign a role to every signed-in user. Rejected because it adds unnecessary custom RBAC where standard `authenticated` behavior is sufficient.

### 2. Resolve `connected_admin` through a Custom Access Token Hook

The elevated role will be added to JWT claims at token-issuance time by a Supabase Custom Access Token Hook that checks whether the current `auth.users` identity has an active `connected_admin` assignment. This follows Supabase's intended mechanism for custom claims and ensures frontend and backend authorization logic can read a consistent token claim.

Alternatives considered:
- Query the role-assignment table on every request from application code. Rejected because it duplicates authorization logic across layers and makes route guards or RLS harder to standardize.
- Store elevated state only in frontend session memory. Rejected because it is not trustworthy for backend authorization.

### 3. Keep baseline authenticated users claim-free for application roles

The token hook should only inject the elevated application role when the user is assigned `connected_admin`. Users without that assignment should continue to receive ordinary authenticated tokens without a custom platform-user role claim.

This preserves a clean separation: baseline authorization uses Supabase's built-in `authenticated` role and future ownership checks with `auth.uid()`, while elevated privileges use a distinct explicit claim.

Alternatives considered:
- Inject a default application role such as `platform_user` for all authenticated users. Rejected because it duplicates Supabase's built-in authenticated state and increases migration and policy complexity.

### 4. Expose elevated authorization through shared access helpers

Frontend middleware, layouts, and admin route checks should consume a shared access helper that can answer whether the current session is elevated as `connected_admin`. This avoids scattering claim-parsing logic and keeps later Connected Action editing checks consistent with the login/demo-mode access work.

Alternatives considered:
- Read raw JWT claims independently in each page or middleware. Rejected because it leads to inconsistent checks and brittle coupling to claim shape.

## Risks / Trade-offs

- [Role assignments drift from actual editor roster] -> Keep assignments explicit and auditable in a dedicated table that can be managed with simple admin operations.
- [JWT claims become the only source of truth and stale sessions miss updates] -> Require claim changes to take effect on next token refresh or re-authentication and document that behavior in validation.
- [Future policies assume all authenticated users have an application role] -> Specify clearly that the absence of `connected_admin` means baseline authenticated access, not an error state.
- [Frontend route checks diverge from backend authorization] -> Centralize elevated-role detection in shared helpers and treat token claims as the common signal across layers.

## Migration Plan

1. Add the elevated-role assignment table and constrain allowed application-role values to the minimal initial set.
2. Implement the Custom Access Token Hook to read role assignments for the current auth user and inject the `connected_admin` claim when present.
3. Update shared auth/access helpers so frontend route guards can detect the elevated claim.
4. Validate that normal authenticated users receive no custom app role and that assigned users receive the elevated role after token refresh.
5. Leave Connected Action content policies unchanged for now; later specs can build on the new claim.

Rollback strategy:
- Remove the token hook configuration and stop injecting the elevated claim.
- Drop or ignore the new role-assignment table if the feature is abandoned before dependent policies are added.
- Because this change does not alter Connected Action table policies yet, rollback is isolated to auth configuration and supporting metadata.

## Open Questions

- Which exact JWT claim shape should be standardized for frontend and policy checks in this codebase?
- Should the role-assignment model support future elevated roles generically now, or remain intentionally minimal around `connected_admin` until a second elevated role exists?
- What operational workflow will be used to grant and revoke `connected_admin` assignments in production?
