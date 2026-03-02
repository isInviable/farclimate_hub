## Why

`ArticleSidePanel.vue` was originally built against the older ORAMA-backed
search data shape. After migrating the explorer to use Supabase hybrid search
and the `SearchResult` type that mirrors the `knowledge.*` tables, the side
panel now receives a different document payload. In particular, identifiers
like `local_id` and several legacy, unstructured fields are no longer present,
which causes the component to break or render incomplete information.

Fixing this is important because the side panel is the primary detailed view
for an article in the explorer. It must remain stable as we evolve the search
backend and data model, and it should rely on the same global types that are
used across the app rather than ad‑hoc shapes.

## What Changes

- Align `ArticleSidePanel.vue` with the new, database-backed search result
  structure (`SearchResult` and related global types) instead of the legacy
  ORAMA payload.
- Replace hard-coded assumptions (e.g. `document.local_id`) with identifiers
  that exist in the new dataset (e.g. `document_uid`, `id`) and derive any
  needed view state from those.
- Introduce (or reuse) a globally shared TypeScript type for the article
  detail/side-panel view model based on the `knowledge.documents`,
  `knowledge.summary`, `knowledge.summary_multilang`, and `knowledge.fulltext`
  schemas.
- Update `ArticleSidePanel.vue` to be fully typed (using `<script setup
  lang="ts">`) and to accept a strongly-typed `document` prop derived from
  global types instead of `any`/raw objects.
- For sections of the UI that rely on fields no longer present in the dataset,
  comment out the rendering logic, keep a clear TODO marker, and produce a
  small “missing data” report that lists which fields/components are currently
  unsupported by the Supabase-backed data.
- Ensure the side panel remains backwards compatible with the explorer search
  store shape so that existing view modes and selection flows keep working.

## Capabilities

### New Capabilities
- `article-side-panel-data-alignment`: Define how the article side panel maps
  onto the canonical database-backed `SearchResult`/document structure, and
  constrain the component to use only well-typed, globally shared structures.

- `article-missing-data-report`: Provide a lightweight, developer-facing report
  of which side-panel fields are not currently derivable from the
  `knowledge.*` tables so future ingestion or schema work can close the gaps.

### Modified Capabilities
- `frontend-search`: Clarify that detailed article views (including the side
  panel) consume the same normalized document shape used by hybrid search
  results, and must not depend on ORAMA-specific or undocumented fields.

## Impact

- **Code**:
  - `apps/web/app/components/explorer/ArticleSidePanel.vue`
  - Potentially `apps/web/app/types/search.d.ts` or a new shared
    `article-detail` type module.
  - Any helper logic that maps search results or Supabase rows into the
    side-panel document object.
- **APIs / Data**:
  - Relies on the existing Supabase `knowledge` schema (`documents`, `summary`,
    `summary_multilang`, `fulltext`) and the normalized search result shape
    exposed by `/api/search`.
- **Dependencies**:
  - No new external runtime dependencies; change is confined to types and
    frontend components in the monorepo.

