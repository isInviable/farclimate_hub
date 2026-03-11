---
name: nuxt-supabase-api
description: Create or modify Supabase composables, server API routes, or auth flows. Use when building data fetching, authentication, or API integration with Supabase.
---

# Nuxt Supabase API

Create or modify composables, server routes, or auth flows that use Supabase. Use the **Supabase MCP** when available to inspect schema or run queries.

## SSR: useSupabaseUser() shape

`useSupabaseUser()` differs in SSR vs client:

- **SSR**: JWT payload with `sub` (user id), no `id`.
- **Client**: Full `User` with `id`.

Always use a helper so queries work in both contexts:

```ts
const getUserId = (): string | undefined => {
  const u = user.value as Record<string, unknown> | null
  return (u?.id as string) ?? (u?.sub as string)
}
```

Never rely only on `user.value?.id` in SSR — it can be undefined.

## Composable pattern

- `useSupabaseClient()` and `useSupabaseUser()` from `@nuxtjs/supabase`.
- Composables in `composables/`; expose `data`, `loading`, `error`, and fetch/action functions.
- Type responses; use Supabase generated types when available (`Database['public']['Tables']['...']`).
- Never expose `SUPABASE_SERVICE_ROLE_KEY` on the client.

## Server routes

- Put in `server/api/`; use `defineEventHandler`, `serverSupabaseClient`, `serverSupabaseUser` from `#supabase/server`.
- Check auth when needed; return proper status codes and typed JSON.

## Guardrails

- RLS is the main authorization mechanism; composables run with the client/user context.
- Handle errors and map them to user-friendly messages; do not expose SQL or stack traces to the client.
- After changes, suggest running tests and a quick security check if touching auth or RLS.
