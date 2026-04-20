> **Archived:** See `REMAINING.md` for manual QA (4.1–4.2) and optional spec sync notes.

## 1. Server API

- [x] 1.1 Add a Nitro route (e.g. `server/api/articles/[id].get.ts` or `server/api/document/by-id.get.ts`) that validates UUID, reads locale (`filter_lang`) consistently with search, calls Supabase `get_documents_by_ids` with a single id, and returns 404 when no row.
- [x] 1.2 Map the RPC row to `ArticleDetail` using the same field mapping as `server/api/search.ts` (extract shared helper if it avoids duplication without a large refactor).
- [x] 1.3 Return JSON suitable for `useFetch` consumption; handle RPC errors with 502 and log like `document-recipe.get.ts`.

## 2. Full-page route

- [x] 2.1 Replace the stub in `apps/web/app/pages/articles/[id].vue` with `useAsyncData`/`useFetch` to the new API keyed by route `id` and locale.
- [x] 2.2 On success, render `ArticleViewAI` with `:document="article"` and `:show-sidebar="false"` (import from explorer components path used elsewhere).
- [x] 2.3 Add loading UI (`USkeleton` / spinner pattern used in explorer) and `showError` or `createError`/Nuxt 404 when status is 404.
- [x] 2.4 Set `useHead` / `useSeoMeta` title from `document.title` when loaded.

## 3. Side panel alignment

- [x] 3.1 Update `ArticleSidePanel.vue` full-page `UButton` `:to` to `/articles/${props.document.id}` (keep `target`/`icon` behavior as today).
- [x] 3.2 Remove or simplify `documentSlug` computed if no longer used; ensure TypeScript stays clean.

## 4. Verification

- [ ] 4.1 Manually open `/articles/{known-uuid}` from a document id taken from a search hit and confirm parity with side panel tabs.
- [ ] 4.2 Hit an unknown UUID and confirm 404 UX.
