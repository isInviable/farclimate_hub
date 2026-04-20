## Why

Case studies ingested from Climate-ADAPT store the canonical page URL in `knowledge.documents.source_url` (see pipeline `push-climate-adapt.ts` and `mapKnowledgeRowToArticleDocument`). The explorer article summary preview does not surface this link, so users cannot jump to the official case study on [climate-adapt.eea.europa.eu](https://climate-adapt.eea.europa.eu) without hunting elsewhere. Surfacing it in the summary tab closes the loop between the Hub and the source platform.

## What Changes

- In **`ArticleSummaryView`** (summary tab under `ArticleViewAI`), add a clear **“View on Climate-ADAPT”** (or equivalent i18n) outbound link when `document.source_url` is a non-empty HTTP(S) URL.
- Optionally show a compact **source** line (label + link) near the short-description block or in the existing “reference” area—implementation detail in `design.md`.
- No **BREAKING** API or schema changes: the field is already mapped in `apps/web/server/utils/knowledgeDocument.ts` and typed on `ArticleDetail` / `SearchResult`.

## Capabilities

### New Capabilities

- `explorer-article-source-link`: Article summary preview SHALL expose an outbound link to the original platform page when `source_url` is present, with accessible labeling and i18n.

### Modified Capabilities

- _(none — existing specs already assume `source_url` on the canonical document shape; this change is additive UI only.)_

## Impact

- **Frontend:** `ArticleSummaryView.vue` (and i18n `en` / `es`). Reuse Nuxt UI patterns (`UButton` link variant or `NuxtLink` + external icon) as in project rules.
- **Data / API:** No migration; `source_url` already populated for Climate-ADAPT ingests. Documents without `source_url` simply omit the row.
