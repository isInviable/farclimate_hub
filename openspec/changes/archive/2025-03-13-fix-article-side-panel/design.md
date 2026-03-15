## Context

The explorer page now uses Supabase hybrid search and a normalized
`SearchResult` type built from the `knowledge.documents`,
`knowledge.summary`, `knowledge.summary_multilang`, and `knowledge.fulltext`
tables. The `ArticleSidePanel.vue` component, however, still expects the
legacy ORAMA payload (e.g. `document.local_id` and other ad‑hoc fields).

Today the side panel is fed a `document` object originating from the search
store, but that object is effectively untyped and can diverge from what the
backend actually returns. This mismatch causes runtime errors (missing
properties) and makes it hard to evolve the ingestion pipeline or database
schema safely.

We already have a global `SearchResult` interface in `app/types/search.d.ts`
that mirrors most of the Supabase-backed fields, and the `/api/search` route
normalizes responses to this shape. The side panel should consume a view model
derived from these global types instead of assuming its own shape.

## Goals / Non-Goals

**Goals:**

- Make `ArticleSidePanel.vue` work correctly with the new, database-backed
  search result shape without relying on legacy ORAMA fields.
- Introduce or reuse a **globally shared TypeScript type** that describes the
  article detail/side-panel payload, derived from the `SearchResult` and
  `knowledge.*` schema rather than anonymous objects.
- Ensure the side panel degrades gracefully when certain fields are not
  available in the current dataset (by commenting out sections and documenting
  the missing data).
- Keep the implementation consistent with the monorepo’s existing patterns
  (Nuxt 4, `<script setup lang="ts">`, Pinia store, global types under
  `app/types/`).

**Non-Goals:**

- No changes to the Supabase database schema itself; we only consume existing
  fields.
- No changes to the hybrid search ranking or retrieval logic (`/api/search`,
  `knowledge.hybrid_search`, etc.).
- No major redesign of the side panel UX; layout and high-level content remain
  similar, aside from sections that must be disabled due to missing data.
- No attempt to re-ingest or enrich data to fill missing fields — this will be
  documented as follow-up work.

## Decisions

1. **Use global `SearchResult` as the base type**

   - **Decision**: Define a dedicated `ArticleDetail`/`ArticleSidePanelDocument`
     type that is composed from the existing `SearchResult` interface plus any
     additional, well-defined fields we actually have (e.g. parsed
     `geographic_characterisation`, `implementation_years`, etc.).
   - **Rationale**: `SearchResult` already captures the canonical mapping from
     Supabase rows to frontend shape. Building the side-panel type on top of it
     keeps everything in sync and prevents drift between the list views and the
     detail view.
   - **Alternative**: Keep `ArticleSidePanel.vue` untyped and patch individual
     fields as we go. Rejected because it perpetuates the drift and makes
     future refactors harder.

2. **Pass typed document props into `ArticleSidePanel.vue`**

   - **Decision**: Convert `ArticleSidePanel.vue` to `<script setup lang="ts">`
     and declare its `document` prop as the new `ArticleDetail` (or similar)
     type, imported from `app/types/`.
   - **Rationale**: This ensures type-checking across the component tree and
     surfaces missing fields at compile time instead of failing at runtime.
   - **Alternative**: Keep using `type: Object` for props and rely on runtime
     checks. Rejected because we explicitly want stronger guarantees and reuse
     of shared types in the monorepo.

3. **Derive identifiers from `document_uid`/`id`, not `local_id`**

   - **Decision**: Replace usages of `document.local_id` with identifiers that
     exist in the new dataset, e.g. `document.document_uid` or `id`, and adjust
     link construction accordingly (e.g. stripping language suffixes only if
     present).
   - **Rationale**: `local_id` is not part of the Supabase-backed schema. The
     hybrid search and ingestion pipeline use `document_uid` as the stable
     logical identifier, so the side panel should, too.
   - **Alternative**: Recreate `local_id` client-side by encoding other fields.
     Rejected because it reintroduces an implicit, undocumented identifier.

4. **Comment out UI sections that require missing data**

   - **Decision**: For any side-panel sections that rely on fields not present
     in `SearchResult` / `knowledge.*` (e.g. very specific narrative
     descriptions or custom scoring metadata), we will:
     - Comment out the template block.
     - Add a concise comment referencing a “missing data report”.
   - **Rationale**: This keeps the UI stable while accurately reflecting what
     data we have. It also provides a clear checklist for future data work.
   - **Alternative**: Show placeholder or empty states for all such fields.
     Partially acceptable, but comments plus a report make the gaps explicit to
     developers, not just users.

5. **Create a lightweight missing-data report in the change directory**

   - **Decision**: Add a markdown file under the change (e.g.
     `openspec/changes/fix-article-side-panel/missing-data-report.md`) that
     lists:
     - Each side-panel section/field that was removed or commented out.
     - The corresponding desired semantic meaning.
     - Whether there is a plausible source in the current DB schema.
   - **Rationale**: This keeps the knowledge of “what we wish we had” close to
     the implementation and ties it to the OpenSpec change for future work.

## Risks / Trade-offs

- **Risk**: Some views or tests might still depend on the old `local_id` or
  legacy fields.
  - **Mitigation**: Search the codebase for usages of those fields in the
    explorer context and adjust them to use the global types/identifiers in a
    single pass.

- **Risk**: The new `ArticleDetail` type may diverge from the evolving
  `SearchResult`/Supabase schema.
  - **Mitigation**: Keep the type definition thin and mostly composed from
    `SearchResult`; avoid duplicating field lists where possible.

- **Risk**: Commenting out sections may hide useful information users are used
  to seeing.
  - **Mitigation**: Keep the number of commented-out sections minimal and track
    them explicitly in the missing-data report so they can be restored once
    data becomes available.

- **Risk**: Additional runtime mapping logic (from raw search hits to
  `ArticleDetail`) could introduce subtle bugs.
  - **Mitigation**: Centralize mapping logic in a small helper (or in the
    server API response normalization) and add basic unit tests or type-level
    assertions where feasible.

