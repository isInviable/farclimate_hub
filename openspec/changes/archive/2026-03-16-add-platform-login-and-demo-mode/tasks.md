## 1. Auth state foundation

- [x] 1.1 Identify the current Supabase auth integration points in the web app and define a shared access-state composable/store for demo mode versus authenticated mode.
- [x] 1.2 Implement session bootstrap and auth-state listeners so the app restores authenticated sessions on reload and defaults to demo mode when no session exists.
- [x] 1.3 Add a forward-compatible access-state shape that can later expose elevated privileges such as `connected_admin` without changing the demo/authenticated contract.

## 2. Login and app-shell behavior

- [x] 2.1 Implement or wire the existing-user login flow in the frontend without adding public signup.
- [x] 2.2 Update the app shell, navigation, or key entry points to communicate whether the user is in demo mode or authenticated mode.
- [x] 2.3 Add logout and signed-in session handling so authenticated users can reliably enter and exit authenticated mode.

## 3. Demo-mode gating for persistence actions

- [x] 3.1 Inventory the current save-oriented or persistence-intent actions in the app that should require authentication in this slice.
- [x] 3.2 Add a shared guard for persistence actions that blocks demo-mode server writes and redirects to login or opens a login gate.
- [x] 3.3 Update affected UI affordances so demo users receive clear feedback that server-saved actions require login.

## 4. Validation

- [x] 4.1 Verify unauthenticated users can still access public reading and exploration flows without login.
- [x] 4.2 Verify authenticated users can log in, reload the app, and retain access to persistence-capable actions while the session remains valid.
- [x] 4.3 Verify demo-mode attempts to trigger persistence actions never perform the server write before authentication.
