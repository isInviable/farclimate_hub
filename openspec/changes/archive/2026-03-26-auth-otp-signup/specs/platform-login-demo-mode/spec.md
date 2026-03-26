# Platform login and demo mode (delta)

Changes to the existing login/demo-mode spec to accommodate OTP as the primary authentication method.

---

## MODIFIED Requirements

### Requirement: Existing users can log in and restore authenticated sessions

The platform SHALL allow existing platform users to authenticate with Supabase Auth using either email OTP or email+password, and SHALL restore authenticated sessions on subsequent page loads until the session is ended or expires.

#### Scenario: User logs in successfully via OTP
- **WHEN** a valid user completes the OTP verification flow
- **THEN** the platform SHALL transition from demo mode to authenticated mode in the active session

#### Scenario: User logs in successfully via password
- **WHEN** a valid existing user completes the password login flow
- **THEN** the platform SHALL transition from demo mode to authenticated mode in the active session

#### Scenario: Authenticated user reloads the application
- **WHEN** an authenticated user refreshes the app or opens a new page while their Supabase session remains valid
- **THEN** the platform SHALL restore the authenticated session and SHALL keep persistence-capable actions available without requiring a fresh login
