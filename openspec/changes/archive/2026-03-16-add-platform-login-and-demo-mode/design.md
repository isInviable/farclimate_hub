## Context

The platform needs to support public exploration before account-backed persistence is introduced. Today, the product direction distinguishes regenerable `knowledge` data from durable user-owned `human` data, but this change only establishes the access behavior that the frontend and auth integration will rely on before the `human` domain exists. The baseline must let unauthenticated visitors browse public content in a clear demo mode, while authenticated users can sign in, restore sessions, and access actions that will later persist user-owned data.

This is a cross-cutting change because it affects Supabase auth integration, frontend state management, route and action gating, and user-facing affordances that communicate whether the user is browsing in demo mode or signed in.

## Goals / Non-Goals

**Goals:**
- Define demo mode as the default platform state when no Supabase session exists.
- Support login for existing users and preserve authenticated sessions across reloads.
- Gate server-persisted actions behind authentication without requiring the `human` schema to exist yet.
- Make the UI contract explicit so public reading flows remain available while save-oriented actions require login.
- Keep the implementation compatible with future elevated-role handling, including `connected_admin`.

**Non-Goals:**
- Public signup, invitations, or account provisioning flows.
- Creation of the `human` schema, durable user-owned tables, or profile/project/pinboard storage.
- Implementation of Connected Action editing or full `connected_admin` authoring flows.
- Hard foreign-key relationships from future human data to regenerable knowledge tables.

## Decisions

### 1. Use Supabase session presence as the source of truth for baseline access state

The frontend will derive its primary access mode from Supabase auth state:
- no session => demo mode
- valid session => authenticated mode

This aligns with standard Supabase patterns and avoids introducing custom auth abstractions before they are needed. Later elevated privileges can layer on top of authenticated sessions using custom claims or RBAC without changing the baseline demo-versus-authenticated contract.

Alternatives considered:
- Use a separate client-side demo flag independent of auth state. Rejected because it creates two competing sources of truth and makes gating persistence actions harder to reason about.
- Introduce role-based access logic immediately. Rejected because this spec only needs baseline login behavior; full RBAC would add complexity too early.

### 2. Centralize access checks in a shared frontend auth/access composable

The app should expose a single access-state API for components, pages, and server-bound actions. That shared layer should answer questions such as whether the user is in demo mode, whether authentication is required for an action, and whether a save action should redirect to login or show a login prompt.

This avoids scattering `session ? ... : ...` checks throughout the app and makes future expansion to `connected_admin` safer.

Alternatives considered:
- Gate each component independently. Rejected because it produces inconsistent UX and makes later policy changes expensive.
- Enforce all gating only in route middleware. Rejected because many persistence actions are triggered inside otherwise public flows and need action-level checks.

### 2b. Show login/demo state in the explorer (browser) header

The user-facing distinction between demo mode and authenticated mode (demo badge, Sign in, user email, Log out) is shown in the explorer header (the header used in the Solutions/explorer flow), not in the main site-wide header. This keeps login and session controls where users are doing exploration and persistence-related actions.

### 3. Treat public reading and exploration as always available to demo users

Routes and components that read public `knowledge` content should remain usable without login. The baseline product promise is that users can browse and evaluate the platform before authenticating.

This means auth gating is selective: it applies to persistence-oriented affordances and server writes, not to public navigation or read-only exploration.

Alternatives considered:
- Require login for all app routes. Rejected because it conflicts with the required demo mode and would block top-of-funnel product usage.

### 4. Gate persistence intents at the UX and execution layers

Actions that would create or update user-owned server data must not proceed in demo mode. The product should either redirect the user to login or present a clear login gate before attempting the write. Even before the `human` schema exists, the contract must be defined where save-oriented UI is disabled, hidden, or intercepted for demo users.

This ensures the app does not imply that demo actions are durable when they are not.

Alternatives considered:
- Allow optimistic local-only saves in demo mode. Rejected for this baseline because it creates misleading expectations and complicates the future transition to real persistence.
- Defer gating until `human` tables exist. Rejected because the frontend access contract needs to be established now.

### 5. Preserve a forward-compatible extension point for elevated roles

Although this spec does not implement Connected Action editing, the access model should not assume only two permanent roles. The access layer should be able to distinguish authenticated baseline users from later elevated users, with elevated privileges sourced from Supabase custom claims or RBAC rather than ownership logic.

Alternatives considered:
- Ignore elevated roles entirely in the baseline design. Rejected because it risks baking in assumptions that would force auth API changes in a later spec.

## Risks / Trade-offs

- [Inconsistent gating between routes and buttons] -> Centralize access checks and require all persistence actions to use the shared guard path.
- [User confusion about what demo mode allows] -> Surface clear mode indicators and explain why save actions require login.
- [Future role expansion forces refactors] -> Keep the access-state model extensible beyond a boolean logged-in check.
- [Frontend-only gating could be treated as sufficient] -> Treat this spec as a UI/session baseline only and add server-side/RLS enforcement in later human-domain specs.

## Migration Plan

1. Add the shared auth/access state layer around Supabase session restoration and change listeners.
2. Update public routes and layouts so unauthenticated users land in demo mode by default.
3. Gate save-oriented actions and persistence entry points behind login.
4. Expose login/logout/session restoration UX in the explorer (browser) header for existing users.
5. Validate that public reading flows still work without login and that authenticated sessions survive reloads.

Rollback strategy:
- Remove or disable the new gating layer and fall back to the current public-only behavior.
- Because this spec does not introduce schema changes, rollback is limited to frontend and auth-integration code.

## Open Questions

- Which save-oriented actions need explicit demo-mode gating in this first slice if the underlying persistence model is not yet implemented everywhere?
- Should unauthenticated save attempts open an inline modal, navigate to a dedicated login page, or preserve return-to context for post-login continuation?
- Is `connected_admin` claim resolution needed in the shared access API now, or is a reserved extension point sufficient until the Connected Action editing spec lands?
