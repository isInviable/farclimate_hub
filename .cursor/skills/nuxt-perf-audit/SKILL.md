---
name: nuxt-perf-audit
description: Audit performance: bundle size, Supabase query efficiency, SSR, and Core Web Vitals. Use when the user wants performance analysis or optimization.
---

# Nuxt Perf Audit

Review performance of the app. Execute directly; no subagent. Use **Supabase MCP** if available to inspect queries or schema.

## Focus areas

- **Bundle**: Code splitting, heavy deps, tree-shaking; use Nuxt’s analysis if needed.
- **Queries**: N+1 patterns, missing indexes, large selects; prefer needed columns and proper indexes.
- **SSR**: Slow server render, large payloads; use `useAsyncData` keys and avoid over-fetching.
- **Frontend**: Large lists (virtualization), images (sizes, lazy load), unnecessary re-renders.

## Output

- Findings by area with concrete file/query/component.
- Recommended changes with priority (high/medium/low).
- Brief impact note where obvious.

Suggest re-measuring after applying high-priority fixes.
