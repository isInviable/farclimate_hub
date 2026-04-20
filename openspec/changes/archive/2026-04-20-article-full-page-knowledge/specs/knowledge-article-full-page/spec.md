# Knowledge article full page (delta)

Specifications for the standalone `/articles/:id` page backed by the knowledge domain and Supabase.

---

## ADDED Requirements

### Requirement: Article page identifies documents by knowledge UUID

The system SHALL interpret the dynamic segment of `/articles/:id` as `knowledge.documents.id` (UUID). The system SHALL NOT treat that segment as a slug-only identifier unless explicitly documented as an alias in a separate requirement.

#### Scenario: Valid UUID in path

- **WHEN** a client requests `/articles/{uuid}` where `{uuid}` matches the UUID format used for `knowledge.documents.id`
- **THEN** the application SHALL attempt to load that document from Supabase using the same document-resolution path as other explorer-backed article views (via `get_documents_by_ids` or equivalent RPC)

#### Scenario: Malformed id

- **WHEN** the path segment is not a valid document id format the server accepts
- **THEN** the server SHALL respond with an error status suitable for “not found” or “bad request” without calling the database with arbitrary strings

### Requirement: Full-page article content matches side panel body

The system SHALL render the full-page article view using the same primary article UI as `ArticleSidePanel`’s body: `ArticleViewAI` (or its documented successor) fed an `ArticleDetail`-compatible document object, with layout appropriate for a full viewport width (equivalent to `show-sidebar="false"` in the slide-over).

#### Scenario: Successful load

- **WHEN** the document exists for the requested id and locale
- **THEN** the page SHALL display summary, structured, full text, and chat tabs as provided by `ArticleViewAI`
- **AND** the user SHALL not need to open the explorer side panel to see the same information

#### Scenario: Loading state

- **WHEN** the document is still loading
- **THEN** the page SHALL show a clear loading state using Nuxt UI patterns consistent with the app

#### Scenario: Missing document

- **WHEN** the document does not exist or cannot be loaded
- **THEN** the page SHALL show a not-found experience (e.g. `404` page or equivalent) without throwing uncaught client errors

### Requirement: Article page data is loaded from Supabase via a server API

The system SHALL obtain `ArticleDetail` fields for the full page through a Nitro server route that uses the Supabase client with the same key strategy as existing document search enrichment (e.g. `server/api/search.ts` / `document-recipe.get.ts`), invoking `get_documents_by_ids` with `doc_ids: [id]` and `filter_lang` aligned to the user’s active locale.

#### Scenario: Locale alignment

- **WHEN** the user’s locale is `es` (or another supported language code used by `filter_lang`)
- **THEN** the server SHALL pass that locale into `get_documents_by_ids` so summaries and recipe-related fields match the explorer for the same document

#### Scenario: Single-document response

- **WHEN** the RPC returns exactly one row for the requested id
- **THEN** the API SHALL return a JSON body that the client can map to `ArticleDetail` without manual field renaming beyond existing search hit mapping

### Requirement: Document title is reflected in page chrome

The system SHALL set the browser title (or Nuxt `useSeoMeta` title) from the loaded document’s `title` when available, with a sensible fallback when loading or on error.

#### Scenario: Successful load sets title

- **WHEN** the document payload includes a non-empty `title`
- **THEN** the document title SHALL appear in the page title metadata visible to the user agent
