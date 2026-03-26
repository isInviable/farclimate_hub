# Auth Email OTP

Self-service sign-up and sign-in via email OTP — the composable methods, two-step UI flow, Supabase configuration, and tabbed login/register experience.

---

### Requirement: Users can request an OTP code by entering their email

The platform SHALL allow any visitor to enter their email address and request a one-time 6-digit verification code. The system SHALL call Supabase Auth's `signInWithOtp` method, which sends the code to the provided email. If the email does not correspond to an existing user, Supabase SHALL create the user on successful verification.

#### Scenario: Visitor enters a valid email and requests OTP
- **WHEN** a visitor enters a valid email address and submits the OTP request form
- **THEN** the system SHALL call `signInWithOtp` with the email and any provided display name, and SHALL transition the UI to the OTP verification step

#### Scenario: Visitor enters an invalid email format
- **WHEN** a visitor submits the form with an improperly formatted email
- **THEN** the system SHALL display a validation error and SHALL NOT send an OTP request

#### Scenario: OTP request fails due to rate limiting
- **WHEN** the OTP request is rejected by Supabase (e.g., rate limit exceeded)
- **THEN** the system SHALL display an error message explaining the user should wait before retrying

### Requirement: Users can verify their identity by entering the 6-digit OTP code

The platform SHALL present a `UPinInput` component (6-digit, numeric, with `otp` prop enabled) for code entry. On completion, the system SHALL call `verifyOtp` to validate the code. On success, the session SHALL be established and the user redirected.

#### Scenario: User enters a valid OTP code
- **WHEN** the user enters all 6 digits of a valid, non-expired OTP code
- **THEN** the system SHALL verify the code with Supabase, establish an authenticated session, and redirect the user to the `returnTo` route or `/`

#### Scenario: User enters an incorrect OTP code
- **WHEN** the user enters a 6-digit code that does not match the issued OTP
- **THEN** the system SHALL display an error message indicating the code is invalid and SHALL allow the user to retry

#### Scenario: OTP code has expired
- **WHEN** the user enters an OTP code after its expiry window (default 5 minutes)
- **THEN** the system SHALL display an error indicating the code has expired and SHALL offer a way to request a new code

### Requirement: Users can resend the OTP code

The platform SHALL provide a "Resend code" action on the verification step. To prevent abuse, the resend action SHALL be disabled for a cooldown period (60 seconds) after each send, with a visible countdown timer.

#### Scenario: User requests a new code after cooldown
- **WHEN** the cooldown timer has elapsed and the user clicks "Resend code"
- **THEN** the system SHALL send a new OTP to the same email and restart the cooldown timer

#### Scenario: User attempts to resend during cooldown
- **WHEN** the user attempts to resend before the cooldown period has elapsed
- **THEN** the resend action SHALL remain disabled and the remaining countdown SHALL be displayed

### Requirement: Display name is required during OTP sign-up

The login page SHALL present "Sign in" and "Sign up" tabs. The "Sign up" tab SHALL display a required "Your name" field alongside the email input. When provided, this value SHALL be passed as `options.data.name` in the `signInWithOtp` call, making it available in `raw_user_meta_data` for the `bootstrap_profile_from_auth_user` trigger to populate `human.profiles.display_name`. The "Sign in" tab SHALL NOT show the name field.

#### Scenario: New user signs up with a display name
- **WHEN** a new user selects the "Sign up" tab, enters a name and email, and completes OTP verification
- **THEN** the system SHALL pass the name in OTP metadata and the profile trigger SHALL set `display_name` to the provided value

#### Scenario: New user tries to sign up without a name
- **WHEN** a new user selects the "Sign up" tab and submits without entering a name
- **THEN** the system SHALL display a validation error and SHALL NOT send an OTP request

#### Scenario: Returning user signs in via the "Sign in" tab
- **WHEN** a returning user selects the "Sign in" tab and enters only their email
- **THEN** the system SHALL not send a name in OTP metadata and SHALL not overwrite the existing profile display name

### Requirement: The useAuth composable exposes OTP methods

The `useAuth` composable SHALL expose `sendOtp(email: string, name?: string)` and `verifyOtp(email: string, token: string)` methods alongside the existing `signIn`, `signOut`, and `refreshSession` methods.

#### Scenario: Component calls sendOtp
- **WHEN** a component calls `sendOtp` with an email and optional name
- **THEN** the composable SHALL invoke `supabase.auth.signInWithOtp` with `{ email, options: { data: { name }, shouldCreateUser: true } }` and return the result

#### Scenario: Component calls verifyOtp with valid token
- **WHEN** a component calls `verifyOtp` with an email and valid token
- **THEN** the composable SHALL invoke `supabase.auth.verifyOtp` with `{ email, token, type: 'email' }`, update the reactive `user` and `session` state, and return the result

### Requirement: Password sign-in remains available as a secondary option

The login page SHALL provide a way for existing password-based users to sign in with email+password. This option SHALL be presented as a secondary path (e.g., a collapsible "Sign in with password" link) below the primary OTP flow.

#### Scenario: User chooses to sign in with password
- **WHEN** a user expands the password sign-in option and enters valid credentials
- **THEN** the system SHALL authenticate via `signInWithPassword` as it does today and redirect the user

#### Scenario: User sees the login page for the first time
- **WHEN** a user navigates to the login page
- **THEN** the primary UI SHALL show tabs for "Sign in" and "Sign up", with the OTP flow as the primary method and the password option collapsed/secondary under the "Sign in" tab
