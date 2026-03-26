# Validation checklist

Run through these after implementation to confirm platform login and demo mode behave as specified.

## 4.1 Unauthenticated users can access public flows

- [X] Open the app in an incognito window (or logged out).
- [X] Visit `/`, `/explorer/explorer`, `/skills`, and any public reading/exploration route.
- [X] Confirm pages render and navigation works without being asked to log in.
- [X] In the explorer (Solutions) flow, confirm the explorer header shows "Demo mode" and "Sign in" (not signed-in state).

## 4.2 Authenticated session and persistence-capable actions

- [X] Sign in via `/login` (or `/admin/login` for admin).
- [X] In the explorer (Solutions) flow, confirm the explorer header shows the user email and "Log out" instead of "Demo mode" / "Sign in".
- [] Reload the page and confirm you remain signed in (session restored).
- [ ] Confirm persistence-capable actions (e.g. admin routes when applicable) remain available without being redirected to login.

## 4.3 Demo-mode persistence actions are blocked

- [ ] While signed out, trigger an action that would persist user-owned data (e.g. attempt to access an admin route, or any future "save" action that calls `requireAuthForPersistence()`).
- [ ] Confirm the app redirects to `/login` with `returnTo` set (or shows a login gate) and does not perform the server write before authentication.
