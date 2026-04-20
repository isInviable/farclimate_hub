## Why

Pinning a full article correctly stores `source_document_uid` on the pin, but pinning **any section of an article** (summary blocks, structured recipe fields, contact, websites, hazards, etc.) through `SelectableBlock` saves the pin with `source_document_uid = null` and no `source_title_snapshot`. On the pinboard (`/explorer/board`) those pins therefore show the degraded "Source document is not linked; title and notes are still saved." warning and cannot deep-link back to the article the snippet was taken from. This is a regression in perceived quality and a navigation dead-end for users.

Root cause: `SelectableBlock.vue` calls `pinContent(blockElement)` with no overrides, so `usePin.pinContent` has no way to populate `source_document_uid` or `source_title_snapshot`. The component receives no parent-document context.

## What Changes

- Propagate the current article's `document_uid` and `title` from `ArticleViewAI` / `ArticleSummaryView` / `ArticleStructuredView` down to every `SelectableBlock` using Vue `provide` / `inject` (no prop drilling through every label/value).
- Update `apps/web/app/components/explorer/SelectableBlock.vue` so `handlePin` reads the injected article context and forwards `sourceDocumentUid`, `title`, and a `body_kind`-appropriate override to `pinContent`.
- Choose a meaningful `body_kind` per block type (contact block → `contact`, website block → `website`, everything else → `text_segment`) and pass the block's `label` as `source_title_snapshot` suffix (or as the snapshot title when no article title is available).
- Add i18n-safe labels in `pins.kinds.*` for any new body kinds that surface on the board and weren't previously emitted by this flow.
- No database schema change. Existing pins with `source_document_uid = null` remain untouched; the degraded state keeps working for truly orphan pins (e.g. block pins created from pages without an article context).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `human-pins-frontend`: tightens the client contract so that pins created from content that lives inside a known article MUST carry `source_document_uid` and `source_title_snapshot`; the "source missing" degraded state is reserved for pins that genuinely have no resolvable parent document.

## Impact

- Affected code:
  - `apps/web/app/components/explorer/SelectableBlock.vue` (consumer of new inject key, wires overrides into `pinContent`).
  - `apps/web/app/components/explorer/ArticleViewAI.vue` (provides the `document` context once per article view).
  - `apps/web/app/components/explorer/ArticleSummaryView.vue` / `ArticleStructuredView.vue` (ensure they receive the article and can rely on inject; add per-block `body_kind` hints where needed).
  - `apps/web/app/composables/usePin.ts` (no signature change; confirm `bodyKind` override wins over legacy `type` mapping).
  - `apps/web/i18n/locales/en.json` / `es.json` (add any new `pins.kinds.*` labels if we introduce `contact` / `website` tiles that weren't rendered before).
- Affected specs: `human-pins-frontend` (amended requirement on source-link propagation).
- No API, DB, or RLS changes. No breaking changes for existing pins.
- Tests: extend `apps/web/tests/human/pinboards.rls.test.ts` only if we add a new field; otherwise add a Vitest component test for `SelectableBlock` asserting that `pinContent` is called with `sourceDocumentUid` and `title` when an article context is provided.
