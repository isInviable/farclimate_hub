## 1. Server API Endpoint

- [x] 1.1 Create `apps/web/server/api/search.ts` — POST endpoint that accepts `{ query, lang, limit }`, generates a query embedding via `@google/genai` (`gemini-embedding-001`, 768 dims), calls Supabase `knowledge.hybrid_search` RPC, fetches full document data, and returns normalized `{ count, hits }` response
- [x] 1.2 Implement "load all" mode — when `query` is empty, skip embedding generation and query all documents joined with summary/fulltext for the given lang
- [x] 1.3 Implement Gemini fallback — if embedding generation fails, fall back to `knowledge.keyword_search` (text-only)
- [x] 1.4 Add server-side LRU cache for query embeddings (keyed by `query+lang`, avoid re-calling Gemini for repeated searches)
- [x] 1.5 Add `GEMINI_API_KEY` to `nuxt.config.ts` `runtimeConfig` (server-only, not public) and `SUPABASE_SERVICE_ROLE_KEY` for server-side Supabase client

## 2. Composable

- [x] 2.1 Create `apps/web/app/composables/useHybridSearch.ts` — exposes `search(query)`, `loadAll()`, `results`, `isSearching`, `error`; reads locale from `useI18n()`; writes to search store
- [x] 2.2 Wire composable to call `$fetch('/api/search', { method: 'POST', body: { query, lang, limit } })` and normalize the response into the store format

## 3. Types and Store Update

- [x] 3.1 Update `apps/web/app/types/search.d.ts` — align `SearchResult` interface with fields available from Supabase (`title`, `summary`, `subtitle`, `fulltext`, `source_url`, `document_uid`, `image_url`); mark ORAMA-only fields as optional
- [x] 3.2 Update `apps/web/app/stores/search.ts` — ensure `resultsData` type accepts the new hit shape (keep `{ count, hits: [{ id, score, document }] }` structure for backward compat)

## 4. Refactor Explorer Page

- [x] 4.1 Refactor `apps/web/app/pages/explorer/explorer.vue` — remove `OramaClient` import and instance, replace `search()` and `loadAllArticles()` with composable calls, keep all view mode / filter / panel logic unchanged
- [x] 4.2 Verify the `filteredPapers` computed still works with the new hit shape (adapt filter field access if needed)

## 5. Refactor SearchFilter Component

- [x] 5.1 Refactor `apps/web/app/components/explorer/deliverable1/SearchFilter.vue` — remove `OramaClient` import and instance, use the composable for `handleSearch` and `searchWithPill`

## 6. Remove ORAMA Dependency

- [x] 6.1 Remove `@oramacloud/client` from `apps/web/package.json` and run `pnpm install` to update lockfile

## 7. Verification

- [x] 7.1 Test search from the explorer page — type a query, verify results load from Supabase hybrid search
- [x] 7.2 Test "load all" on page mount — verify all documents appear on initial load
- [x] 7.3 Test language switching — switch to Spanish, verify search uses `lang: 'es'`
- [x] 7.4 Test SearchFilter pills — click a recommendation pill, verify search triggers via composable
- [x] 7.5 Verify no ORAMA references remain in the codebase (`grep -r orama apps/web/app/`)
- [x] 7.6 Verify existing view modes (list, grid, map, instagram) render correctly with new data shape
