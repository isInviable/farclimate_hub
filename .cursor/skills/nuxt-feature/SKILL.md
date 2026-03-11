---
name: nuxt-feature
description: Implement a full feature across DB, API, and frontend in sequence. Use when the user wants a complete feature end-to-end without delegating to subagents.
---

# Nuxt Feature

Implement a full feature step by step in the **same agent context** (no subagent orchestration) to save tokens.

## Workflow

1. **Clarify** — If the request is vague, ask for scope and acceptance criteria.
2. **Plan** — List: schema/API changes, composables or server routes, pages/components. Check OpenSpec or specs if the project uses them.
3. **Branch** — Suggest or create a feature branch (e.g. `feat/name`). Do not commit or push without user request.
4. **DB** — If needed: migrations, RLS (see nuxt-supabase-db). Use Supabase MCP to inspect schema.
5. **API** — Composables and/or server routes (see nuxt-supabase-api); respect getUserId() for SSR.
6. **Frontend** — Pages and components with Nuxt UI + Tailwind (see nuxt-ui-frontend).
7. **Test** — Add or run tests (see nuxt-test); fix failures.
8. **Security** — If auth/RLS changed, run a quick security pass (see nuxt-security-audit).
9. **Summary** — List what was done; suggest user run tests and commit when ready.

## Guardrails

- Do not auto-commit or auto-push. Suggest `/commit` or “commit when ready.”
- Prefer existing OpenSpec/tasks if the project uses them (e.g. openspec-apply-change).
- Keep changes minimal and scoped to the feature.
