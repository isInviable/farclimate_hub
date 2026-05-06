# Article side panel data alignment (change delta)

Delta for capability `article-side-panel-data-alignment` under change `article-explorer-modal-redesign`.

---

## ADDED Requirements

### Requirement: Explorer article modal preserves canonical document rules

The explorer article surface implemented as `ArticleSidePanel.vue` (or a successor component retaining the same props and emit contract for callers) SHALL obey **Article side panel uses canonical document shape** and **Article side panel handles partial data gracefully** without weakening them. Replacing the slide-over with a blocking modal SHALL NOT change which fields are read from `ArticleDetail`, SHALL NOT introduce `local_id` or ORAMA-only dependencies, and SHALL continue to handle missing optional fields with omit or neutral empty states.

#### Scenario: Modal opened from search hit

- **WHEN** a user opens the article modal from an explorer search hit
- **THEN** the selected hit's `document` SHALL be mapped into `ArticleDetail` and passed into the modal pipeline exactly as required by the baseline spec's search-hit scenario

#### Scenario: Modal opened by document uid

- **WHEN** the modal is opened with `documentUid` and without an inline `document` prop
- **THEN** the implementation SHALL resolve the document using the same approach as the current side panel (e.g. existing fetch to `/api/document-by-uid`) and SHALL surface load and error states without throwing
