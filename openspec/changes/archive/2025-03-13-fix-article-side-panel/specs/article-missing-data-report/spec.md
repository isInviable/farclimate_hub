## ADDED Requirements

### Requirement: Missing data report for article side panel
The system SHALL maintain a developer-facing report describing which
`ArticleSidePanel.vue` fields and sections cannot currently be populated from
the Supabase-backed dataset.

The report SHALL be stored as a markdown file under
`openspec/changes/fix-article-side-panel/missing-data-report.md` and SHALL list
for each affected field:
- The UI location/section (e.g. “Impact summary”, “Cost-benefit analysis”).
- The expected semantic meaning of the field.
- Whether a plausible source exists in the current `knowledge.*` schema.

#### Scenario: Field removed or commented out
- **WHEN** a field or section in `ArticleSidePanel.vue` is removed or commented
  out because the underlying data is not available
- **THEN** the field SHALL be added to the missing-data report with a brief
  explanation and, if applicable, a note about potential future data sources

#### Scenario: Data becomes available later
- **WHEN** the ingestion pipeline or database schema is extended so that a
  previously missing field becomes reliably available
- **THEN** the corresponding entry in the missing-data report SHALL be updated
  or removed, and the side-panel UI section MAY be restored as part of a future
  change

