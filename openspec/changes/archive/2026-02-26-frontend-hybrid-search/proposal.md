## Why

The explorer page currently uses ORAMA Cloud for search, with hardcoded API keys and duplicate `OramaClient` instances in both `explorer.vue` and `SearchFilter.vue`. We recently implemented `keyword_search`, `match_documents`, and `hybrid_search` RPC functions directly in our Supabase database. Switching the frontend to use these Supabase functions eliminates the external ORAMA dependency, unifies search around our own infrastructure, and enables the app to leverage the hybrid search (keyword + semantic) we built in the backend. The search logic is currently embedded directly in page components, making it impossible to reuse in other contexts.

## What Changes

- Create a Nuxt server API endpoint (`/api/search`) that generates a query embedding via Gemini and calls the Supabase `hybrid_search` RPC, returning normalized results
- Create a `useHybridSearch` composable that wraps the server API, providing reactive search state (results, loading, error) reusable across any component
- Refactor `explorer.vue` to use the new composable instead of `OramaClient`
- Refactor `SearchFilter.vue` to use the new composable instead of its own `OramaClient` instance
- Update the search store (`stores/search.ts`) to align with the new result shape from Supabase
- Update the `SearchResult` type (`types/search.d.ts`) to match the document shape returned by Supabase (fields from `knowledge.documents`, `knowledge.summary`, `knowledge.fulltext`)
- Remove the `@oramacloud/client` dependency

## Capabilities

### New Capabilities
- `frontend-search`: Composable and server API for hybrid search via Supabase, decoupled from any specific page component

### Modified Capabilities
- `hybrid-search`: Adding client-side invocation requirements (how the frontend calls the existing backend RPC function)

## Impact

- **Code**: `explorer.vue`, `SearchFilter.vue`, `stores/search.ts`, `types/search.d.ts`, new `composables/useHybridSearch.ts`, new `server/api/search.ts`
- **Dependencies**: Remove `@oramacloud/client`, add `@google/genai` (server-side for embedding generation)
- **APIs**: New internal `/api/search` endpoint; all search now routes through Supabase RPCs
- **Breaking**: The search results shape changes — any component consuming `searchStore.resultsData.hits` will need to adapt to the new format
