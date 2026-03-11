---
name: nuxt-debug
description: Diagnose and fix Nuxt 3 runtime errors, SSR/hydration issues, middleware loops, or build failures. Use when the user encounters errors or unexpected behavior.
---

# Nuxt Debug

Diagnose and fix Nuxt 3 errors and misbehavior. Execute directly; no subagent delegation.

## 1. Reproduce and categorize

- Capture error message and stack; identify where it happens (build, SSR, hydration, client runtime).
- Classify: **hydration mismatch**, **auto-import** (`X is not defined`), **SSR lifecycle** (e.g. `window`/`document` without guard), **middleware loop**, **useAsyncData/useFetch**, **Supabase/auth**, **build/Vite**.

## 2. Known pitfalls

- **useSupabaseUser()**: In SSR there is `sub` but no `id`. Use `getUserId()` that checks both; otherwise SSR queries can silently fail.
- **Hydration**: Avoid different server vs client output (e.g. dates, random ids). Use `<ClientOnly>` for browser-only content.
- **Browser APIs**: Use `onMounted` or `if (import.meta.client)` before `window`/`document`.
- **Middleware loops**: Ensure the redirect target (e.g. `/login`) is excluded from the auth check so it doesn’t redirect again.
- **useAsyncData**: Use unique keys per request; call at top level, not inside event handlers (use `$fetch` in handlers if needed).

## 3. Investigate and fix

- Read relevant files, `nuxt.config.ts`, middleware, and composables.
- Apply a **minimal** fix. Explain root cause and how to avoid it next time.
- If the fix touches schema/RLS, suggest a migration and point to the nuxt-supabase-db skill.

## Output

- Diagnosis and category.
- Exact change (file + lines or snippet).
- Why it worked and one prevention tip.
- Suggest running tests after the fix.
