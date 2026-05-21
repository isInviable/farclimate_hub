## Why

Explorer chat helps users ask questions across multiple selected papers, but today they cannot save full conversations to the pinboard, cannot pin arbitrary text selections from corpus chat modals, and have no way to see or open which papers grounded a specific AI answer. Assistant replies already support per-message `chat_response` pins, yet there is no thread-level snapshot and no structured citations—only unstructured context blobs with inconsistent article identifiers.

## What Changes

- Extend **`POST /api/chat`** to accept a structured **document catalog** (`articleId`, `documentUid`, `title`) and a **`mode`** (`single` | `corpus`), and to return **per-assistant-turn citations** (validated subset of catalog IDs) after streaming completes.
- Update **`ViewModeChat`** with two behavioral modes: **single-article** (no citation UI; existing article context) and **corpus** (citation chips under assistant messages).
- Add **citation chips UX** on corpus chat: collapsed label with article count, expandable list of clickable titles that open the article in the explorer (via `document_uid`).
- Add **“Save conversation”** (snapshot once) using existing `body_kind: "chat"` and `PinRenderChat`, serializing the full message thread and optional per-message citations at save time.
- Wrap **corpus chat surfaces** (explorer and pinboard fullscreen modals) in **`ArticleTextSelectionCapture`** so selection-only text pinning matches the rest of the explorer.
- Align context **`articleId`** with **`document_uid`** in corpus mode so citations, deep links, and pinboard “open article” use the same stable identifier.
- Keep **single-article chat** in `ArticleViewAI` unchanged for citations (no chips); text selection pinning continues via the existing article wrapper.

## Capabilities

### New Capabilities

- `explorer-chat-citations`: Structured per-response citations from `/api/chat`, catalog validation, and corpus-mode citation chips with open-article navigation.
- `explorer-chat-pin-capture`: Full-thread conversation snapshot pin, corpus-mode text selection capture, and pin payload conventions for chat threads.

### Modified Capabilities

- `human-pins-frontend`: Clarify chat thread pin rendering expectations when `body_kind` is `chat` and optional `citationsByMessageId` is present; document open-article from pinned citation metadata if stored.

## Impact

- **API**: `apps/web/server/api/chat.ts` — catalog input, citation extraction (`generateObject` on finish), stream metadata to client.
- **Frontend**:
  - `apps/web/app/components/explorer/wf/viewmodes/ViewModeChat.vue`
  - New component(s) for citation chips (e.g. `ChatMessageCitations.vue`)
  - `apps/web/app/pages/explorer/explorer.vue`, `apps/web/app/pages/explorer/board/index.vue` — selection capture wrapper, open-article handler for chips
  - `apps/web/app/components/explorer/ArticleViewAI.vue` — pass `mode: single` / catalog (no citation UI)
- **Pinboard**: Existing `PinRenderChat`, `PinBodyRenderer`; optional display of stored citations on chat pins.
- **i18n**: New keys for save conversation, references count, expand/collapse, empty state.
- **Tests**: API citation validation (ids ⊆ catalog); pin payload builder for `chat` body kind.
