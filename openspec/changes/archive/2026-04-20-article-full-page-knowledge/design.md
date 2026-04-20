## Context

`ArticleSidePanel.vue` already renders the full article experience via `ArticleViewAI` with an `ArticleDetail` prop sourced from explorer search (`get_documents_by_ids` enrichment in `server/api/search.ts`). The page `apps/web/app/pages/articles/[id].vue` is a stub: it shows the route param only and does not load Supabase data. The side panel’s “open full page” control still targets `/wireframes/article/:slug`, which does not match a stable **knowledge `documents.id` (UUID)** deep link.

## Goals / Non-Goals

**Goals:**

- Treat `/articles/:id` as the **canonical full-page** article URL where `:id` is `knowledge.documents.id`.
- Load one document with the **same normalized fields** as search hits (`ArticleDetail`), using Supabase RPC `get_documents_by_ids` with the active locale (`filter_lang`), consistent with `document-recipe.get.ts` / search.
- Render **the same main content** as the side panel body: `ArticleViewAI` with `show-sidebar` appropriate for full width (mirror slide-over: `show-sidebar="false"`).
- Return **404** when the id is missing, invalid UUID shape, or RPC returns no row.
- Point the side panel external/open link at `/articles/:id` using `props.document.id`.

**Non-Goals:**

- Replacing or redesigning `ArticleViewAI` tabs or internal layout beyond what is needed for full-page width.
- New RLS or knowledge schema migrations (assume existing RPC and keys remain as today).
- Authenticated-only article pages unless the app already gates similar routes (follow existing public vs auth patterns for Nitro + Supabase key usage).

## Decisions

1. **Server API vs only client Supabase**  
   **Choice:** Add a small Nitro endpoint, e.g. `GET /api/articles/[id]` or `GET /api/document?id=`, that calls `get_documents_by_ids` with `[id]` and `filter_lang` from query or `Accept-Language` / i18n locale.  
   **Rationale:** Matches `search` and `document-recipe` (service or publishable key on server), avoids exposing complex client key rules, and gives a single place for 404 mapping.  
   **Alternative:** Client `useSupabaseClient` + RPC — rejected unless RLS already allows anonymous read on knowledge documents; server route stays consistent with search.

2. **Response shape**  
   **Choice:** Return JSON that maps 1:1 to `ArticleDetail` (or reuse the same mapper as search’s `buildHit` without score).  
   **Rationale:** `ArticleViewAI` and children expect `ArticleDetail`; no duplicate DTOs.

3. **Page data loading**  
   **Choice:** `useFetch` / `useAsyncData` in `[id].vue` keyed by `id` + locale.  
   **Rationale:** Nuxt-standard SSR-friendly fetch, aligns with project rules.

4. **Side panel link**  
   **Choice:** `UButton :to="\`/articles/${document.id}\`"` (or computed), `target="_blank"` preserved if desired.  
   **Rationale:** UUID is stable; slug split on `document_uid` is no longer required for this entry point.

5. **Invalid id**  
   **Choice:** Validate UUID format on server; short-circuit 400 or 404 before RPC.  
   **Rationale:** Avoid noisy RPC errors and clearer UX.

## Risks / Trade-offs

- **[Risk] RPC returns empty for valid id (lang mismatch)** → Mitigation: use same `filter_lang` as explorer (`useI18n().locale`); document in UI if empty (optional follow-up: fallback lang).
- **[Risk] Wireframe URLs bookmarked** → Mitigation: non-goal for this change; optional redirect task later.
- **[Trade-off] Server key can read all documents** → Same as search API today; no expansion of surface area if reusing the same Supabase client pattern.

## Migration Plan

1. Ship API + page + side panel link update together so links are not broken mid-deploy.
2. No DB migration.
3. Rollback: revert page + API + side panel link in one commit.

## Open Questions

- Whether `/articles/:id` should be indexed for SEO (e.g. `useSeoMeta` from title) — recommend yes, minimal, in implementation tasks.
- Whether to keep `wireframes/article` routes for legacy demos; out of scope unless product requests redirects.

## Archive (2026-04-20)

Change archived with manual verification tasks (4.1–4.2) still open. See **`REMAINING.md`** for QA checklist and optional **delta → main spec** sync steps.
