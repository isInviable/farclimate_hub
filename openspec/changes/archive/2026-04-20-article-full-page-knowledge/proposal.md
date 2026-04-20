## Why

The explorer’s article experience is rich inside `ArticleSidePanel`, but standalone links still point at placeholder or wireframe routes. Teams and users need a **public-style full page** that shows the **same article UI** as the side panel, loaded by a **stable knowledge-domain document id** from Supabase so bookmarks and shared URLs work without going through search first.

## What Changes

- Implement `/articles/[id]` so `:id` is the **knowledge document UUID** (`knowledge.documents.id`), load the document via Supabase (same canonical shape as search / `get_documents_by_ids`), and render the same content stack as the side panel body (`ArticleViewAI` with full-width layout).
- Add or reuse a **server API** (or server-side fetch) that returns one `ArticleDetail`-compatible payload for a given document id and locale, with clear **404** when the document does not exist or is not visible under current keys/RLS.
- Align the side panel **“open full page”** action with this route (UUID-based `/articles/:id` instead of `/wireframes/article/:slug`) so explorer and deep links stay consistent.

## Capabilities

### New Capabilities

- `knowledge-article-full-page`: Full-page article view keyed by knowledge `documents.id`, Supabase-backed fetch, parity with `ArticleSidePanel` body (`ArticleViewAI`), loading and error states, and i18n/locale alignment with the rest of the explorer.

### Modified Capabilities

- `article-side-panel-data-alignment`: Extend alignment so the **full-page entry point** uses the same canonical id as the side panel (`ArticleDetail.id` / `knowledge.documents.id`) and the documented route for opening the article in a new context is `/articles/:id`, not slug-only wireframe URLs.

## Impact

- **Frontend**: `apps/web/app/pages/articles/[id].vue`, likely `ArticleSidePanel.vue` (link target), shared types `ArticleDetail` if mapping helpers are extracted.
- **Backend**: New or extended Nitro route under `apps/web/server/api/` calling Supabase `get_documents_by_ids` (or equivalent) with service/publishable key patterns consistent with `search` and `document-recipe`.
- **Dependencies**: Existing RPC `get_documents_by_ids`, `ArticleViewAI` / summary stack, i18n.
