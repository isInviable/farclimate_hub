## Context

The platform uses Supabase Auth with email+password. Users are created manually in the Supabase dashboard — there is no self-service registration. The frontend has a `useAuth` composable (`signInWithPassword`, `signOut`, `refreshSession`) and a `/login` page using Nuxt UI components. A `human.profiles` row is auto-created by a PostgreSQL trigger (`bootstrap_profile_from_auth_user`) whenever a new `auth.users` row is inserted, pulling `name` from `raw_user_meta_data`.

The app has a demo mode for unauthenticated visitors; authentication is only required for persistence actions (saving searches, projects, etc.).

## Goals / Non-Goals

**Goals:**
- Allow new users to self-register via email OTP (no password required).
- Allow existing and new users to sign in via email OTP as the primary method.
- Keep password-based sign-in available as a secondary option for existing users.
- Use Nuxt UI's `UPinInput` for a polished OTP code entry experience.
- Reuse existing infrastructure: `bootstrap_profile_from_auth_user` trigger, `useAuth` composable, Nuxt UI components.

**Non-Goals:**
- Organization/team management (deferred to a later change).
- Social OAuth providers (Google, GitHub, etc.).
- Phone/SMS OTP.
- Admin user self-registration (connected_admin role remains manually assigned).
- Custom email delivery infrastructure (use Supabase's built-in email sender or configured SMTP).

## Decisions

### 1. OTP variant: 6-digit code (not magic link)

**Choice**: Use `supabase.auth.signInWithOtp()` which sends a 6-digit code, verified via `supabase.auth.verifyOtp()`.

**Important**: Magic Link and OTP share the same `signInWithOtp()` API. The difference is purely in the email template: using `{{ .Token }}` sends a 6-digit code, using `{{ .ConfirmationURL }}` sends a clickable link. Email OTP is enabled by default in Supabase — the setup requires editing **both** the "Confirm signup" template (sent for new users) and the "Magic Link" template (sent for returning users) to use `{{ .Token }}`. The OTP length must also be set to 6 in Authentication → Providers → Email → "Email OTP Length".

**Alternatives considered**:
- *Magic link*: Same API, just a different email template variable. Simpler (one click), but opens in a new tab/context, breaks the user's flow, and is harder to test. The 6-digit code keeps the user on the same page.

**Rationale**: The pin-code UX (using `UPinInput`) feels more intentional and keeps context. The user stays on the same tab throughout.

### 2. Tabbed login/register page with two-step flow

**Choice**: A single `/login` page with `UTabs` ("Sign in" / "Sign up") and two steps:
1. **Step 1 — Form**: On the "Sign in" tab, user enters email only. On the "Sign up" tab, user enters name (required) + email. Clicks "Continue" / "Create account". This calls `signInWithOtp`.
2. **Step 2 — Verify**: User enters the 6-digit OTP via `UPinInput`. On completion, calls `verifyOtp`. On success, redirects to `returnTo` or `/`.

A collapsible "Sign in with password instead" link below the OTP flow (on the sign-in tab only) reveals the existing email+password form.

**Alternatives considered**:
- *Single form with optional name*: Confusing — returning users see a name field they don't need.
- *Separate `/register` page*: More pages to maintain.
- *OTP-only, remove password*: Would lock out existing password-based users.

**Rationale**: Tabs make the intent clear. Sign-in is streamlined (email only), sign-up collects the name upfront. Under the hood, Supabase's `signInWithOtp` handles both cases identically (`shouldCreateUser: true`).

### 3. Pass display name via `raw_user_meta_data`

**Choice**: The display name field is passed as `options.data.name` in the `signInWithOtp` call. The existing `bootstrap_profile_from_auth_user` trigger already reads `raw_user_meta_data ->> 'name'` to populate `human.profiles.display_name`.

**Rationale**: Zero database changes needed. The existing trigger handles profile creation seamlessly.

### 4. Composable extension, not replacement

**Choice**: Add `sendOtp(email, name?)` and `verifyOtp(email, token)` methods to the existing `useAuth` composable. Keep `signIn` (password-based) intact.

**Rationale**: Minimal change, backward compatible, single source of auth logic.

## Risks / Trade-offs

- **Email deliverability** → Supabase uses its built-in email for dev/small-scale. For production, configure a custom SMTP provider (Resend, Postmark, etc.) in the Supabase dashboard. Document this as a setup step.
- **Rate limiting** → Supabase applies default rate limits on OTP sends (typically 1 per 60s per email). The UI should disable the "resend" button with a countdown timer to prevent user confusion.
- **OTP expiry** → Supabase OTPs expire after 5 minutes (configurable). The UI should communicate this. If expired, the user can request a new code.
- **Existing password users** → They can use either method. OTP doesn't overwrite their password. No migration needed.
- **Name field is optional** → If a returning user signs in via OTP without entering a name, no harm — `shouldCreateUser` won't create a duplicate, and the profile already exists.
