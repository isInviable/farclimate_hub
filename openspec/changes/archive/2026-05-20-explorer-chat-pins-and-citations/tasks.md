## 1. API — catalog and citations

- [x] 1.1 Define shared TypeScript types for `ChatCatalogEntry`, `ChatCitation`, and request/response shapes (`mode`, `catalog`)
- [x] 1.2 Update `server/api/chat.ts` to accept `mode` and `catalog`; build system context using `articleId` from catalog (`document_uid` preferred)
- [x] 1.3 Implement post-stream `generateObject` citation extraction with Zod schema `{ citedArticleIds: string[] }` and filter to catalog IDs
- [x] 1.4 Attach citations to the UI stream (message metadata or custom data part) and document client consumption pattern
- [x] 1.5 Add server unit tests: unknown IDs stripped, empty catalog handling, corpus vs single mode

## 2. ViewModeChat — catalog, mode, and citations UI

- [x] 2.1 Add `chatMode` computed (`single` | `corpus`) from `document` vs `hits` props
- [x] 2.2 Build `catalog` from `document` or `hits` using `document_uid` as `articleId` when available
- [x] 2.3 Send `mode` + `catalog` in `chat.sendMessage` body; keep legacy blobs during transition if needed
- [x] 2.4 Store per-message citations from stream metadata on assistant messages
- [x] 2.5 Create `ChatMessageCitations.vue` (collapsed count, expandable titles, loading state)
- [x] 2.6 Render citation chips only in corpus mode; hide when citation count is zero
- [x] 2.7 Emit `open-article` with `documentUid` on citation click

## 3. Parent surfaces — open article and text selection

- [x] 3.1 Wrap `ViewModeChat` in `ArticleTextSelectionCapture` in `explorer.vue` chat modal (`sourceView: chat`)
- [x] 3.2 Wrap `ViewModeChat` in `ArticleTextSelectionCapture` in `board/index.vue` chat modal
- [x] 3.3 Handle `@open-article` in explorer: open side panel / `openDocumentFromQueryParam`
- [x] 3.4 Handle `@open-article` in pinboard: navigate to explorer `?document=<uid>` (or in-app opener if available)
- [x] 3.5 Pass `mode: single` + single-entry catalog from `ArticleViewAI` (no citation UI regression)

## 4. Conversation snapshot pin

- [x] 4.1 Add “Save conversation” control to `ViewModeChat` (disabled while streaming/submitted)
- [x] 4.2 Serialize `chat.messages` + optional `citationsByMessageId` + `mode` + `sourceView` for `body_kind: chat`
- [x] 4.3 Wire `PinCaptureDialog` / `usePin` with composed title (first user message truncated)
- [x] 4.4 Add i18n keys: `chat.saveConversation`, `chat.referencesCount`, `pins.capture.conversationTitle` (en/es/it)

## 5. Pinboard display (optional enhancement)

- [x] 5.1 Extend `PinRenderChat.vue` to show citation titles under assistant messages when `citationsByMessageId` is present
- [x] 5.2 Wire citation click in pin detail to `open-article` event on pin board

## 6. Tests and verification

- [x] 6.1 Add `pinCapturePayload` or chat pin builder test for `body_kind: chat` with messages and citations map
- [x] 6.2 Add Vitest for catalog builder (`document_uid` vs fallback id)
- [x] 6.3 Manual test matrix: explorer corpus chat (citations + save + selection), pinboard chat, article single chat (no chips, selection works)
