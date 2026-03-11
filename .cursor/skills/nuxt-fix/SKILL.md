---
name: nuxt-fix
description: Fix a bug across the layers that need it (DB, API, frontend). Use when the user reports a bug that may touch multiple layers.
---

# Nuxt Fix

Fix a bug in one or more layers in the **same agent context** (no subagent) to save tokens.

## Workflow

1. **Reproduce** — Get error message, steps, and affected area (auth, data, UI, etc.).
2. **Diagnose** — Find root cause; use nuxt-debug patterns if it’s SSR/hydration/auth. Check DB/RLS if data or permissions are wrong.
3. **Plan** — List which layers need changes (migration, composable, component, etc.).
4. **Implement** — Apply minimal changes per layer; use nuxt-supabase-db, nuxt-supabase-api, nuxt-ui-frontend as needed.
5. **Verify** — Run tests; suggest manual check if relevant.
6. **Summary** — What was wrong, what was changed, and how to avoid it. Do not commit unless the user asks.

## Guardrails

- Fix root cause, not only symptoms.
- No auto-commit/auto-push. Suggest commit after user confirms.
- For single-layer bugs, a single skill (e.g. nuxt-debug or nuxt-ui-frontend) may be enough; use this skill when the fix spans DB + API + UI.
