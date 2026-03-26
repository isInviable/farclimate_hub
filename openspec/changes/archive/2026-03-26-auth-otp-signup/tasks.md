## 1. Supabase Configuration

- [x] 1.1 Edit **both** the "Confirm signup" and "Magic Link" email templates (Authentication → Email Templates) to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}` — "Confirm signup" is sent for new users, "Magic Link" for returning users. Customize with app branding.

## 2. Composable: Extend useAuth

- [x] 2.1 Add `sendOtp(email: string, name?: string)` method that calls `supabase.auth.signInWithOtp({ email, options: { data: { name }, shouldCreateUser: true } })` and returns the result
- [x] 2.2 Add `verifyOtp(email: string, token: string)` method that calls `supabase.auth.verifyOtp({ email, token, type: 'email' })`, updates reactive `user`/`session` state, and returns the result

## 3. Login Page: Two-Step OTP Flow

- [x] 3.1 Refactor `login.vue` step 1: email input + optional "Your name" field + "Continue" button that calls `sendOtp`; show validation errors and rate-limit feedback
- [x] 3.2 Implement step 2: OTP verification UI using `UPinInput` (6 digits, numeric, `otp` prop enabled); on `@complete` call `verifyOtp`; display error states for invalid/expired codes
- [x] 3.3 Add "Resend code" action with 60-second cooldown timer (disabled during cooldown, shows countdown)
- [x] 3.4 Add "Back" action to return from step 2 to step 1 (change email)
- [x] 3.5 Move the existing password sign-in form into a collapsible secondary section ("Sign in with password instead") below the OTP flow
- [x] 3.6 Preserve existing `returnTo` query param behavior for post-auth redirect

## 4. Polish and Edge Cases

- [x] 4.1 Handle loading states: disable inputs/buttons while OTP is being sent or verified
- [x] 4.2 Handle error messages: map Supabase error codes to user-friendly messages (rate limit, expired code, invalid code, network error)
- [x] 4.3 Auto-submit when all 6 digits are entered (use `@complete` event from `UPinInput`)
- [x] 4.4 Verify that `bootstrap_profile_from_auth_user` trigger correctly creates profile with display name from OTP metadata

## 5. Manual Verification

- [ ] 5.1 Test new user sign-up: enter email + name → receive code → enter code → verify session is active and profile is created with display name
- [ ] 5.2 Test returning user sign-in: enter email (no name) → receive code → enter code → verify session and existing profile unchanged
- [ ] 5.3 Test password fallback: expand password section → sign in with existing credentials → verify redirect works
- [ ] 5.4 Test error flows: wrong code, expired code, resend cooldown, rate limit
- [ ] 5.5 Test demo mode transition: verify demo→authenticated transition works correctly after OTP sign-in
