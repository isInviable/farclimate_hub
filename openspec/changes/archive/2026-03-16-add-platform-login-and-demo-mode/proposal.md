## Why

The platform needs a clear baseline access model before user-owned persistence can be added safely. Users must be able to browse public content without logging in, while authenticated sessions must unlock persistence-related behavior without conflating demo browsing with real account-backed usage.

## What Changes

- Introduce a frontend access model with two baseline user experiences: demo mode for unauthenticated visitors and signed-in mode for authenticated users.
- Define login and session behavior for existing users without adding public self-service signup in this step.
- Require persistence-related actions to be unavailable in demo mode and redirected or gated behind login when they would save server-side user data.
- Establish the product contract that public reading and exploration flows remain available without authentication.
- Set the implementation boundary for later work by defining this phase without introducing the `human` schema or durable user-owned tables yet.

## Capabilities

### New Capabilities
- `platform-login-demo-mode`: Baseline platform authentication, demo browsing, session persistence, and login-gated save actions.

### Modified Capabilities
- None.

## Impact

- Affected frontend authentication state handling, route and action gating, session persistence, and save-action UX.
- Likely touches Nuxt app auth composables, middleware, layout or navigation affordances, and Supabase auth integration.
- Establishes the access contract that later human-domain persistence work will build on.
