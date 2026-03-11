---
name: nuxt-supabase-db
description: Create or modify database schema, migrations, RLS policies, or indexes for Supabase PostgreSQL. Use when the user needs database changes.
---

# Nuxt Supabase DB

Create or modify migrations, tables, RLS policies, and indexes. Use the **Supabase MCP** to inspect current schema when available.

## Migration layout

- File: `supabase/migrations/YYYYMMDDHHMMSS_snake_case_description.sql`.
- Order: (1) Schema (CREATE/ALTER), (2) Indexes, (3) Helper functions, (4) RLS policies, (5) GRANTs, (6) Triggers if needed.

## Rules

- **RLS mandatory** on all tables: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- Primary key: `id UUID DEFAULT gen_random_uuid()`. Timestamps: `created_at`, `updated_at` with `DEFAULT NOW()` and update trigger.
- Use `DROP POLICY IF EXISTS` before `CREATE POLICY` so migrations are re-runnable.
- GRANT to `anon`, `authenticated`, `service_role` as needed.

## RLS and recursion

- RLS on user-role or self-referencing tables must **not** use subqueries against the same table (infinite recursion). Use **SECURITY DEFINER** helper functions owned by `postgres` that read the needed data and return a boolean or value.

## Seeding auth.users via SQL

- If inserting into `auth.users` directly, all string columns must be `''` not `NULL` (GoTrue requirement). Create a row in `auth.identities` with provider `'email'` for login to work.

## Checklist before finishing

- RLS enabled and policies cover intended roles; no self-referencing RLS subqueries; indexes on FKs and common filters; GRANTs correct; migration idempotent where possible.
