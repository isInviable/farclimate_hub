## Context

The explorer page (`apps/web/app/pages/explorer/explorer.vue`) and `SearchFilter.vue` both instantiate their own `OramaClient` with hardcoded credentials. The search store (`stores/search.ts`) holds an ORAMA-shaped response (`{ count, elapsed, hits: [{ document, id, score }] }`). Multiple view components and modals consume `searchStore.resultsData.hits`.

The backend now has three Supabase RPC functions in the `knowledge` schema:
- `keyword_search(query_text, match_count, filter_lang)` — full-text only
- `match_documents(query_embedding, match_count, filter_lang, filter_content_type)` — semantic only
- `hybrid_search(query_text, query_embedding, match_count, filter_lang, filter_content_type, full_text_weight, semantic_weight, rrf_k)` — combined RRF

Hybrid search requires a query embedding vector. The Gemini API key cannot be exposed to the browser, so embedding generation must happen server-side.

The Supabase client is already available via `composables/useSupabaseClient.ts` (uses `runtimeConfig.public.supabaseUrl` and `supabasePublishableKey`).

## Goals / Non-Goals

**Goals:**
- Replace ORAMA with Supabase hybrid search for all explorer search functionality
- Decouple search logic into a reusable `useHybridSearch` composable
- Keep the existing UI/UX behavior (search box, filters, view modes, side panel) unchanged
- Support language-aware search (en/es) using the existing i18n locale

**Non-Goals:**
- Changing the filter UI or adding new filters
- Adding new view modes or changing the explorer layout
- Implementing server-side pagination (current limit of 30 results is sufficient)
- Building a standalone search page separate from the explorer

## Decisions

### 1. Server API endpoint for embedding generation

**Decision**: Create a Nuxt server route `/api/search.ts` that accepts a query string and language, generates the query embedding via Gemini, calls Supabase `hybrid_search` RPC, and returns normalized results.

**Why**: The Gemini API key must stay server-side. Bundling embedding generation and the Supabase RPC call into a single server endpoint keeps the round-trip count to one from the browser's perspective.

**Alternative considered**: Having the browser call Supabase `keyword_search` directly (no embedding needed) and only use server for hybrid. Rejected because we want the full hybrid experience by default, and splitting the logic adds complexity.

### 2. Embedding model for query embeddings

**Decision**: Use the same `gemini-embedding-001` model (768 dimensions) that was used to generate document embeddings in the pipeline. Reuse the `@google/genai` package already available in the monorepo.

**Why**: Query and document embeddings must use the same model for cosine similarity to be meaningful.

### 3. Composable design (`useHybridSearch`)

**Decision**: Create `composables/useHybridSearch.ts` that exposes:
- `search(query: string)` — triggers a search via `$fetch('/api/search', ...)`
- `loadAll()` — loads all documents (empty query, keyword-only fallback)
- `results` — reactive array of normalized search results
- `isSearching` — reactive boolean
- `error` — reactive error state

The composable reads the current locale from `useI18n()` internally. It writes results to the search store so existing consumers (view modes, modals, chat) continue to work.

**Why**: Decoupling search into a composable allows reuse in any component without importing OramaClient or knowing the API details.

**Alternative considered**: Putting search logic directly in the Pinia store. Rejected because composables are the standard Nuxt pattern for stateful logic with side effects, and the store should remain a simple data holder.

### 4. Result shape normalization

**Decision**: The server endpoint returns results in a shape compatible with the existing store format:
```
{
  count: number,
  hits: Array<{
    id: string,           // document UUID
    document_uid: string, // e.g. "climateadapt::slug"
    score: number,
    document: { title, summary, fulltext, ... }
  }>
}
```

The server joins `knowledge.documents`, `knowledge.summary`, and `knowledge.fulltext` to build the full document object for each hit. This preserves compatibility with existing view components that read `hit.document.title`, `hit.document.summary`, etc.

**Why**: Minimizes changes to downstream components. The view modes, side panel, and modals all consume `searchStore.resultsData.hits[].document` — keeping this shape means they don't need to change.

### 5. "Load all" behavior

**Decision**: When no search query is provided (initial page load), use `keyword_search` with a broad query or a direct SQL query to return all documents. The server endpoint handles this as a special case — no embedding needed.

**Why**: The current ORAMA implementation searches with `term: "*"` to load all articles. With Supabase, we can simply query all documents from the `knowledge.documents` table joined with summary data.

**Alternative considered**: Always requiring a search term. Rejected because the current UX loads all articles on mount, and changing this would be a UX regression.

### 6. Search store adaptation

**Decision**: Keep the existing `stores/search.ts` shape but update the `SearchResult` type to match the Supabase document fields. The key mapping:
- ORAMA `hit.document` → Supabase document (title, summary, subtitle, etc.)
- ORAMA `hit.score` → Supabase `score` (RRF score for hybrid, rank for keyword)
- ORAMA `hit.id` → Supabase document `id` (UUID)

**Why**: The store is consumed by many components. Keeping the same structural shape (`resultsData.hits[].document`) avoids a cascade of changes.

## Risks / Trade-offs

- **[Latency]** Server-side embedding generation adds ~200-500ms per search vs direct ORAMA calls. → Acceptable for the search UX; debouncing in the composable prevents excessive calls.
- **[Gemini API cost]** Each search query generates one embedding API call. → Mitigate with server-side caching of recent query embeddings (LRU cache by query+lang).
- **[Load-all query]** Fetching all documents on page load may get slow as the dataset grows. → Currently ~20 documents, will revisit with pagination when needed.
- **[Type mismatches]** Components relying on ORAMA-specific fields in `SearchResult` (like `geographic_characterisation`) may break if those fields aren't in Supabase. → The summary table stores most fields; any missing ones will be null-safe in the type definition.

## Open Questions

- Should we cache query embeddings on the server to avoid re-computing for repeated searches? (Recommended: yes, simple LRU cache)
- Should the "load all" endpoint return full document data or just metadata for the list view? (Recommendation: return full data since the dataset is small)
