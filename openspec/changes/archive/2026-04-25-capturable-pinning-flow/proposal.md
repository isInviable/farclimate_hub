## Why

Article pinning currently depends on `SelectableBlock`, which mixes visual card layout, cosmetic block selection, pin controls, DOM scraping, and persistence. The click-to-select behavior no longer maps to a product feature, while upcoming capture needs require a cleaner way to pin arbitrary article content, selected text, AI summaries, recipe sections, chatbot responses, images, contacts, and references with source article context and optional notes.

## What Changes

- Replace the "click a block to select it" model with explicit capture actions only.
- Introduce a reusable capturable block wrapper that can wrap arbitrary rendered content through its default slot and render a default pin action, while allowing consumers to override the pin UI through a named slot.
- Add article-scoped text-selection capture so users can select text anywhere in supported article reading surfaces and save it to the board.
- Add a capture confirmation flow that allows the user to add an optional note before the pin is persisted.
- Persist explicit structured payloads for captured blocks instead of deriving pin content from rendered DOM text, with DOM-derived text allowed only as a fallback.
- Preserve source article metadata for all article-hosted captures, including `source_document_uid`, `source_title_snapshot`, and the existing valid location snapshot.
- Extend the pinboard rendering path as needed so new or more specific `body_kind` values render safely through the existing frontend registry/fallback behavior.
- Remove or retire the cosmetic local selected state from article capture wrappers.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `human-pins-frontend`: Replace selectable block pinning with explicit capturable block and selected-text capture behavior; require note-capable pin creation and structured payloads for article-hosted captures.

## Impact

- Affected frontend components include `SelectableBlock.vue` or its successor, `ArticleSummaryView.vue`, `ArticleStructuredView.vue`, `ArticleViewAI.vue`, `ViewModeChat`/document chat surfaces where captures are enabled, and pinboard card/rendering components.
- Affected composables include `usePin.ts` and potentially `usePinsSupabase.ts` to support explicit payload creation, optional notes at creation time, and new `body_kind` mappings.
- No required database schema or backend migration is expected because `human.pins` already supports free-text `body_kind`, JSON `body.data`, logical source document fields, and `user_note`.
- No breaking changes to existing stored pins are intended; existing pins must continue to render through current mappings or safe fallback behavior.
