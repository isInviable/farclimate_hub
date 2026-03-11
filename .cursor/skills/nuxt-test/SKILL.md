---
name: nuxt-test
description: Write or run tests with Vitest or Playwright. Use when the user wants to test components, composables, or run the test suite.
---

# Nuxt Test

Write or run unit (Vitest) and E2E (Playwright) tests. Execute directly; no subagent.

## Scope

- User can ask for a specific component/composable, “all” tests, or “e2e”. If unclear, infer from recent `git diff` or ask.

## Conventions

- Unit tests next to code or in `tests/`; mock Supabase client for composables (no real DB).
- E2E in Playwright config; use real or test DB as per project setup.
- Descriptive test names; align with BDD/specs when they exist.
- Use Nuxt/Vitest/Playwright test utils and auto-imports.

## Workflow

1. Run existing tests when the user asks to “run tests” or after changes.
2. Add or update tests for new or changed behavior; keep assertions focused.
3. Report pass/fail and any new or updated files. Suggest fixing failing tests before commit.
