---
description: Stack (Nuxt UI, Supabase) and MCP usage for agents
globs: **/*
alwaysApply: false
---

# Stack and MCPs

## UI: Nuxt UI (mandatory)

- **Always** prefer Nuxt UI components over custom HTML/Tailwind. Use `UButton`, `UInput`, `UForm`, `UTable`, `UCard`, `UModal`, etc.
- Check Nuxt UI docs via the **Nuxt UI MCP** when available (e.g. `user-nuxt-ui` server) for components and examples.
- Follow `.cursor/rules/nuxt-vue3-components.mdc` for Vue 3 / Composition API and component standards.

## Backend / Data: Supabase

- Database schema, migrations, and RLS are the source of truth. Use the **Supabase MCP** (e.g. `project-*-supabase` or `plugin-supabase-supabase`) to inspect schema, run queries, or list resources when needed.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` on the client. Use `useSupabaseClient()` and `useSupabaseUser()` from `@nuxtjs/supabase`.
- For user ID in SSR and client, use a helper that checks both `id` and `sub`: `getUserId()` (see nuxt-supabase-api skill or project composables).

## Project context

- Farclimate HUB: structured data platform for climate case studies; Explorer, Connected (visualizations + admin), static pages. Supabase (PostgreSQL + storage), multilingual schema, stable IDs.
