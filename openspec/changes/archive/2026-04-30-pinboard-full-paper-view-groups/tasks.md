## 1. Full paper mode/state (no sidebar expansion)

- [x] 1.1 Reuse the existing Full paper sidebar entry/mode in pinboard view (`/apps/web/app/pages/explorer/board/` and shared board component); do not add new sidebar items.
- [x] 1.2 Ensure Full paper selection renders the new two-section content without breaking existing map/all/body-kind selection flow.

## 2. Full paper grouping logic

- [x] 2.1 Implement derived list A for full pinned papers (`body_kind === "document"`), preserving stable ordering.
- [x] 2.2 Implement derived list B for papers with pinned sections/content by grouping non-`document` pins with non-empty `source_document_uid`.
- [x] 2.3 Exclude fragment pins missing `source_document_uid` from grouped paper list B.

## 3. Rendering and i18n

- [x] 3.1 Render two clearly labeled groups in Full paper mode: full pinned papers and papers with pinned sections/content.
- [x] 3.2 Add i18n keys for both internal group labels (and empty-state copy if needed), reusing existing sidebar Full paper label.
- [x] 3.3 Verify switching between Full paper mode and existing modes preserves expected board behavior.

## 4. Verification

- [x] 4.1 Add/update unit tests for grouping helpers/state selection where applicable.
- [x] 4.2 Manual QA: confirm Full paper mode displays (a) full pinned papers and (b) grouped papers with pinned sections/content.
