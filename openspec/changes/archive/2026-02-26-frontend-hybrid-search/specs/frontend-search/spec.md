## ADDED Requirements

### Requirement: Server API endpoint for search

The system SHALL provide a Nuxt server route at `/api/search` (POST) that accepts:
- `query` (string) — the user's search text (may be empty for "load all")
- `lang` (string, default `'en'`) — language filter (`'en'` or `'es'`)
- `limit` (number, default 30) — max results to return

When `query` is non-empty, the endpoint SHALL:
1. Generate a query embedding using `gemini-embedding-001` (768 dimensions) via `@google/genai`
2. Call the Supabase `knowledge.hybrid_search` RPC with the query text, embedding, limit, and lang
3. For each result, fetch the full document data (summary fields, fulltext) by joining `knowledge.documents`, `knowledge.summary`, and `knowledge.fulltext`
4. Return a normalized response

When `query` is empty, the endpoint SHALL return all documents for the given language without generating an embedding (direct database query).

The endpoint SHALL return the response in the shape:
```json
{
  "count": number,
  "hits": [
    {
      "id": "uuid",
      "document_uid": "string",
      "score": number,
      "document": { "title": "...", "summary": "...", ... }
    }
  ]
}
```

#### Scenario: Hybrid search with query
- **WHEN** the client POSTs `{ "query": "flood protection", "lang": "en", "limit": 10 }`
- **THEN** the endpoint SHALL generate an embedding for "flood protection", call `hybrid_search`, and return up to 10 results with full document data

#### Scenario: Load all documents
- **WHEN** the client POSTs `{ "query": "", "lang": "en" }`
- **THEN** the endpoint SHALL return all English documents without generating an embedding

#### Scenario: Spanish language search
- **WHEN** the client POSTs `{ "query": "inundación", "lang": "es" }`
- **THEN** the endpoint SHALL generate an embedding and call `hybrid_search` with `filter_lang = 'es'`

#### Scenario: Gemini API error
- **WHEN** the Gemini embedding API call fails
- **THEN** the endpoint SHALL fall back to `keyword_search` (text-only) and still return results

#### Scenario: Server-side embedding cache
- **WHEN** the same query+lang combination is searched within a short time window
- **THEN** the endpoint SHALL reuse the cached embedding instead of calling Gemini again

### Requirement: useHybridSearch composable

The system SHALL provide a composable `useHybridSearch()` in `composables/useHybridSearch.ts` that exposes:
- `search(query: string): Promise<void>` — performs a hybrid search via the `/api/search` endpoint
- `loadAll(): Promise<void>` — loads all documents for the current locale
- `results: Ref<SearchHit[]>` — reactive array of search results
- `isSearching: Ref<boolean>` — true while a search is in progress
- `error: Ref<string | null>` — error message if the last search failed

The composable SHALL read the current locale from `useI18n()` and pass it as the `lang` parameter.

The composable SHALL write results to the search store (`useSearchStore`) so existing consumers continue to work.

#### Scenario: Basic search
- **WHEN** a component calls `search('flood')`
- **THEN** `isSearching` SHALL become `true`, a request SHALL be made to `/api/search`, results SHALL be written to both `results` and the search store, and `isSearching` SHALL become `false`

#### Scenario: Load all on mount
- **WHEN** a component calls `loadAll()` on mount
- **THEN** all documents for the current locale SHALL be fetched and stored

#### Scenario: Language reactivity
- **WHEN** the locale changes from `'en'` to `'es'` while results are displayed
- **THEN** the composable SHALL NOT auto-refresh (the calling component decides when to re-search)

#### Scenario: Error handling
- **WHEN** the `/api/search` endpoint returns an error
- **THEN** `error` SHALL be set with the error message, `results` SHALL remain unchanged, and `isSearching` SHALL become `false`

### Requirement: Remove ORAMA dependency

The system SHALL remove all references to `@oramacloud/client` from:
- `explorer.vue` — remove `OramaClient` import, instance creation, and direct `client.search()` calls
- `SearchFilter.vue` — remove `OramaClient` import, instance creation, and direct `client.search()` calls
- `package.json` — remove the `@oramacloud/client` dependency

All search functionality SHALL be routed through the `useHybridSearch` composable.

#### Scenario: No ORAMA imports remain
- **WHEN** the codebase is searched for `orama` or `OramaClient`
- **THEN** no matches SHALL be found in any source file

#### Scenario: explorer.vue uses composable
- **WHEN** `explorer.vue` is mounted
- **THEN** it SHALL use `useHybridSearch().loadAll()` to load initial results and `useHybridSearch().search()` for user searches

#### Scenario: SearchFilter.vue uses composable
- **WHEN** a user types a search query in `SearchFilter.vue` and presses Enter
- **THEN** the search SHALL be performed via the `useHybridSearch` composable, not via ORAMA

### Requirement: Search result type compatibility

The system SHALL update `types/search.d.ts` to reflect the fields available from Supabase while maintaining backward compatibility with existing component usage.

The `SearchResult` interface SHALL include at minimum:
- `title: string`
- `summary: string`
- `subtitle: string`
- `fulltext: string`
- `source_url: string`
- `document_uid: string`
- `image_url: string`

Fields not available from Supabase (e.g., `geographic_characterisation`, `sectors`, `keywords`) SHALL be typed as optional and may be populated from the summary JSON data if available.

#### Scenario: View components render without errors
- **WHEN** search results are displayed in list, grid, map, or instagram view modes
- **THEN** all views SHALL render without type errors or missing required fields

#### Scenario: Side panel displays document
- **WHEN** a user clicks a search result to open the side panel
- **THEN** the document SHALL display title, summary, and available metadata without errors
