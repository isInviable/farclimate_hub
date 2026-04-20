# Article side panel data alignment (delta)

Extension of alignment rules so the “open full page” entry uses the canonical knowledge document id route.

---

## ADDED Requirements

### Requirement: Side panel full-page link uses canonical article URL

The system SHALL provide a control in `ArticleSidePanel.vue` (or equivalent) to open the current article in a full page at `/articles/{documentId}` where `documentId` is `ArticleDetail.id` (the Supabase `knowledge.documents.id` UUID). The system SHALL NOT use `/wireframes/article/:slug` as the primary full-page entry point for knowledge-backed articles unless a separate legacy requirement explicitly mandates it.

#### Scenario: User opens full page from explorer

- **WHEN** the user activates the full-page/open control from the article side panel while viewing a document with a defined `id`
- **THEN** the browser SHALL navigate to `/articles/{id}` with that same `id`
- **AND** the destination SHALL load the document from Supabase per the `knowledge-article-full-page` capability

#### Scenario: Document id is present

- **WHEN** `ArticleDetail.id` is set on the document passed to the side panel
- **THEN** the full-page link SHALL not depend on parsing `document_uid` for slug extraction as the only means of navigation
