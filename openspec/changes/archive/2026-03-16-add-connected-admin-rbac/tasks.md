## 1. RBAC data model

- [x] 1.1 Identify the Supabase schema location for elevated role assignments and add the minimal table or structure needed to associate authenticated users with `connected_admin`.
- [x] 1.2 Constrain the stored role values so this slice supports the minimal elevated role set without introducing a default role for normal authenticated users.
- [x] 1.3 Define how role assignments will be seeded, granted, or managed for the initial small editor cohort.

## 2. JWT claim injection

- [x] 2.1 Implement the Supabase Custom Access Token Hook that looks up whether the current authenticated user has an active `connected_admin` assignment.
- [x] 2.2 Inject the agreed elevated authorization signal into the access token only for assigned users and leave normal authenticated users without a custom application role claim.
- [x] 2.3 Document or wire the token refresh behavior needed for role grants and revocations to take effect in active sessions.

## 3. Shared authorization access

- [x] 3.1 Extend the shared auth/access helpers to expose whether the current session is elevated as `connected_admin`.
- [x] 3.2 Update admin or Connected Action route checks to consume the shared elevated-role helper instead of ad hoc claim parsing.
- [x] 3.3 Keep baseline authenticated behavior unchanged for non-elevated users in existing login and access flows.

## 4. Validation

- [ ] 4.1 Verify an assigned user receives the `connected_admin` authorization signal after sign-in or token refresh.
- [x] 4.2 Verify a normal authenticated user remains a standard Supabase `authenticated` user without a custom platform-user role.
- [ ] 4.3 Verify shared frontend or middleware checks can distinguish elevated sessions from baseline authenticated sessions without changing Connected Action table policies yet.
