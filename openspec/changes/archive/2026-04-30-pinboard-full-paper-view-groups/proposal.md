## Why

The pinboard sidebar currently allows filtering by `body_kind`, but users need a focused **Full paper** view that separates two different relationships to a paper: pins of the whole paper itself vs pins of sections/content within that paper. This improves navigation and avoids mixing document-level curation with fragment-level curation.

## What Changes

- Keep the existing sidebar structure and existing **Full paper** entry; do not add new sidebar items.
- Define Full paper view behavior to show two result groups:
  - **Full pinned papers** (`body_kind === "document"`).
  - **Papers with pinned sections/content** (any non-`document` pins grouped by `source_document_uid`).
- Preserve existing All/body-kind filters and map behavior; this change only updates the content shown inside Full paper view.
- Ensure grouping and labels are i18n-backed and consistent with existing pinboard UX patterns.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `human-pins-frontend`: Extend Full paper view requirements to include two internal sections (document pins vs fragment-backed papers), without changing sidebar item count.

## Impact

- Affected frontend areas in `apps/web`: Full paper view grouping logic and board rendering for grouped paper results.
- i18n: add labels/copy for the Full paper entry and its two subgroups.
- No DB schema/API changes required; behavior derives from existing `human.pins` fields (`body_kind`, `source_document_uid`, `source_title_snapshot`).
