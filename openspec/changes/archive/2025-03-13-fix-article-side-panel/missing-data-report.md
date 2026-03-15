# Article Side Panel – Missing Data Report

This document tracks UI fields/sections in the article side panel path that
cannot currently be populated from the Supabase-backed dataset used by the
hybrid search.

## Scope

- Component: `apps/web/app/components/explorer/ArticleSidePanel.vue`
- Indirect child: `apps/web/app/components/explorer/ArticleViewAI.vue`

At present, `ArticleSidePanel.vue` itself has been aligned to the canonical
`ArticleDetail`/`SearchResult` shape and no longer depends on fields that are
absent from the dataset (the old `local_id` usage was replaced with
`document_uid`/`id`).

The only fields that are present in legacy types but not currently populated by
the Supabase-backed dataset are used inside `ArticleViewAI.vue`:

### 1. Stakeholder participation narrative

- **UI location**: `ArticleSummaryView` → “Who is involved” block
- **Field**: `document.stakeholder_participation`
- **Intended meaning**: Free-text narrative describing which stakeholders are
  involved in the case study and how.
- **Current data source**: Not present in `knowledge.summary`,
  `knowledge.summary_multilang`, or `knowledge.fulltext` as a dedicated field.
  It may exist only in the original Climate-ADAPT content.
- **Status in UI**: Used only as a fallback text when no AI-generated summary
  is available; the block renders fine if the field is missing.

### 2. Cost–benefit / economic narrative

- **UI location**: `ArticleSummaryView` → “Economic data” block and
  `ArticleViewAI` parsed document helpers.
- **Field**: `document.cost_benefit`
- **Intended meaning**: Narrative description of economic costs/benefits and
  related quantitative context.
- **Current data source**: Not mapped from the Supabase `knowledge.*` schema
  into the frontend’s normalized document shape.
- **Status in UI**: Used as a fallback when no AI-generated economic summary is
  available; when absent, the block displays “No economic data available”.

## Commentary vs. Removal

Because these fields are optional and the UI already handles their absence
gracefully (showing neutral fallback text), they have **not** been commented
out in the templates. Instead:

- The side panel and its children now rely on the canonical `ArticleDetail`
  type built on top of `SearchResult`.
- All hard dependencies on non-existent identifiers (notably `local_id`) have
  been removed or replaced.

Future ingestion or schema work MAY:

- Introduce structured columns for stakeholder participation and economic
  analysis, or
- Map the relevant portions of the original content into existing text fields,
  after which these UI sections can be revisited for richer rendering.

