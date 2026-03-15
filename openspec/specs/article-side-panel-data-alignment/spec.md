# Article side panel data alignment spec

Alignment of ArticleSidePanel.vue with the canonical SearchResult/document shape and Supabase-backed identifiers. No dependency on legacy ORAMA-only fields (e.g. local_id).

---

### Requirement: Article side panel uses canonical document shape

The system SHALL render `ArticleSidePanel.vue` using a document payload that is derived from the canonical `SearchResult` interface and the underlying `knowledge.*` tables, not from legacy ORAMA-specific fields.

The side-panel document type SHALL be defined as a global TypeScript type (`ArticleDetail` or equivalent) under `apps/web/app/types/` and SHALL be composed primarily from `SearchResult` fields (title, summary, subtitle, fulltext, source_url, document_uid, image_url, sectors, climate_impacts, adaptation_approaches, geographic_characterisation, implementation_years, contact, references, websites).

The side-panel component SHALL NOT depend on fields that are not present in the normalized dataset (e.g. `local_id`) for its core functionality.

#### Scenario: Side panel receives a search hit
- **WHEN** a user clicks on a search result in the explorer
- **THEN** the selected hit's `document` (of type `SearchResult`) SHALL be mapped into the global `ArticleDetail` type and passed to `ArticleSidePanel` as a strongly-typed `document` prop

#### Scenario: Side panel uses database-backed identifiers
- **WHEN** `ArticleSidePanel.vue` constructs links or internal identifiers for the current article
- **THEN** it SHALL use fields that exist in the Supabase-backed schema (`document_uid` and/or `id`) and SHALL NOT rely on `local_id` or other ORAMA-only identifiers

#### Scenario: Types are shared across the monorepo
- **WHEN** the article detail type is updated (e.g. to include a new field from `knowledge.summary`)
- **THEN** the change SHALL be made in the shared global types definition under `apps/web/app/types/` and automatically reflected in `ArticleSidePanel.vue` and other consumers

### Requirement: Article side panel handles partial data gracefully

The system SHALL handle cases where certain optional fields (e.g. `geographic_characterisation`, `implementation_years`, `websites`) are missing from the dataset without throwing runtime errors.

#### Scenario: Optional fields are absent
- **WHEN** a document lacks optional metadata fields that the side panel would normally display
- **THEN** `ArticleSidePanel.vue` SHALL still render without errors and SHALL either omit those sections or show neutral/empty states, according to the design

#### Scenario: Missing fields are tracked for follow-up
- **WHEN** a field that the side panel previously relied on is not available in the new dataset
- **THEN** its usage in the template and script SHALL be commented out with a clear reference to the missing-data report (capability `article-missing-data-report`) so future work can restore the section when data becomes available
