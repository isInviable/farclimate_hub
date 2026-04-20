# explorer-article-source-link Specification

## Purpose

Ensure the article **summary** preview exposes the **original platform URL** (`source_url`) when available so users can open the case study on its source site (e.g. Climate-ADAPT).

## Requirements

### Requirement: Summary preview shows outbound link when source URL exists

When `ArticleSummaryView` (or successor used under `ArticleViewAI`) renders a document whose `source_url` is a non-empty `http` or `https` URL, the UI SHALL display a clearly labeled outbound link to that URL. The link SHALL open in a new browsing context (`target="_blank"`) with `rel` including `noopener` and `noreferrer`. User-visible labels SHALL come from the application i18n system.

#### Scenario: Climate-ADAPT case study with source_url

- **WHEN** the loaded document has `source_url` set to a valid `https://` URL from ingestion
- **THEN** the summary tab SHALL show an actionable link to that URL with a descriptive translated label

#### Scenario: Missing or invalid source_url

- **WHEN** `source_url` is empty, whitespace-only, or not an `http`/`https` URL
- **THEN** the summary tab SHALL NOT show the outbound link control (no placeholder error state required)

### Requirement: Link does not block other summary content

The source link control SHALL be visually distinct but SHALL NOT replace or hide existing summary sections (short description, gallery, sectors, etc.).

#### Scenario: Layout coexists with existing blocks

- **WHEN** the user views the summary tab with both `source_url` and other summary fields populated
- **THEN** all existing summary blocks SHALL remain visible and the source link SHALL appear without breaking the grid or causing layout overflow on narrow viewports
