---
name: nuxt-security-audit
description: Audit security of RLS policies, auth middleware, exposed secrets, and injection risks. Use when the user wants a security review or after auth/RLS changes.
---

# Nuxt Security Audit

Review security of the app or recent changes. Execute directly; no subagent.

## Scope

- If the user specifies an area (RLS, auth, endpoints, secrets), focus there. Otherwise use `git diff` to focus on changed files, or do a general pass.

## Checklist

1. **RLS**: All tables have RLS enabled; policies match intended roles. No self-referencing subqueries in RLS (use SECURITY DEFINER helpers).
2. **Secrets**: `SUPABASE_SERVICE_ROLE_KEY` and other secrets never exposed to the client; no secrets in repo or logs.
3. **Auth**: Protected routes use auth middleware; redirect targets (e.g. `/login`) are excluded from redirect logic to avoid loops.
4. **Injection**: No raw SQL concatenation; parameterized queries / Supabase client only. Inputs validated and escaped for XSS.
5. **Env**: `.env` and `.env.*` in `.gitignore`; no committed secrets.

## Output

- **Critical**: Must fix before deploy.
- **High**: Fix soon.
- **Medium / Info**: Improve when possible.
- For each: file/area and concrete recommendation.

Suggest re-running after fixing critical/high items.
