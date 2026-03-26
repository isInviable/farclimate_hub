## Why

Users are currently created manually in the Supabase dashboard. There is no self-service registration flow — the login page only supports existing users with email+password. This blocks onboarding new users without admin intervention.

Email OTP replaces the need for passwords entirely: users sign up and sign in by entering their email and verifying a 6-digit code. This eliminates password reset flows, password validation, and separate email confirmation — the OTP itself proves email ownership (GDPR-compliant by design). The existing password-based login remains as a fallback for already-provisioned users.

## What Changes

- Add a self-service sign-up/sign-in flow using Supabase Email OTP (6-digit code sent to the user's email).
- Extend `useAuth` composable with OTP methods (`signInWithOtp`, `verifyOtp`).
- Replace or augment the existing `/login` page with a two-step flow: email entry → OTP code verification using Nuxt UI's `UPinInput` component.
- Existing password-based users continue to work — the UI offers both paths (OTP as primary, password as secondary).
- Enable Email OTP provider in Supabase Auth configuration.

## Capabilities

### New Capabilities
- `auth-email-otp`: Self-service sign-up and sign-in via email OTP — covers the composable methods, the two-step UI flow, Supabase configuration, and the unified login/register experience.

### Modified Capabilities
- `platform-login-demo-mode`: The login page gains a new primary authentication method (OTP) alongside the existing password flow. Demo mode behavior and persistence gating remain unchanged.

## Impact

- **Frontend**: `useAuth.ts` composable, `login.vue` page, new OTP verification UI component.
- **Supabase config**: Email OTP provider must be enabled in the Supabase dashboard; OTP email template should be customized.
- **Database**: No schema changes required — `human.profiles` already auto-creates via the `bootstrap_profile_from_auth_user` trigger, which reads `raw_user_meta_data` (populated by OTP sign-up's `options.data`).
- **Dependencies**: No new packages — Nuxt UI's `UPinInput` and `@supabase/supabase-js` already available.
