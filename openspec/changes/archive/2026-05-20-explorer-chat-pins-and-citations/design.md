## Context

`ViewModeChat` powers chat in three places: single-article tab inside `ArticleViewAI` (`:document`), explorer fullscreen modal (`:hits` from search selection), and pinboard fullscreen modal (`:hits` from selected solutions). It uses `@ai-sdk/vue` `Chat` → `POST /api/chat`, which streams plain markdown with documents injected as unstructured text blobs ending in `articleId: <id>`. Assistant text parts already use `CapturableBlock` with `body_kind: chat_response`; `PinRenderChat` exists for `body_kind: chat` + `data.messages[]` but is unused by chat UI.

Corpus mode currently embeds `hit.id` (knowledge UUID) as `articleId`, while explorer navigation and pinboard deep links use `document_uid`. `getAiResponse` already demonstrates structured `relatedArticles` via `generateObject` against the same `articleId:` convention.

## Goals / Non-Goals

**Goals:**

- Per-assistant-message **citations** in corpus mode: validated list of papers the model relied on for that answer.
- **Citation chips** under assistant bubbles: collapsed count, expandable clickable titles → open article by `document_uid`.
- **Save conversation** once (snapshot): `body_kind: chat`, full `messages[]`, optional `citationsByMessageId`.
- **Selection-only text pin** on corpus chat surfaces via `ArticleTextSelectionCapture`.
- Stable **`document_uid`** as `articleId` in catalog and context for corpus mode.
- Keep streaming answer UX; citations appear after the turn completes.

**Non-Goals:**

- Enforcing or displaying a maximum of 20 articles in context (existing product limit; not part of this change).
- Token-level / sentence-level attribution or legal-grade provenance.
- Live-updating conversation pins as the thread grows.
- Citation UI in single-article chat (`ArticleViewAI`).
- Replacing per-message `chat_response` pins (they remain supported).
- New database tables or migrations (`body_kind` is an open string; payload lives in `body.data`).

## Decisions

### 1. Chat modes: `single` vs `corpus`

**Decision:** `ViewModeChat` derives mode from props: `document` present → `single`; `hits` present → `corpus`. Parents do not pass a redundant mode flag unless needed for tests.

**Rationale:** Matches existing prop split; avoids citation UI in article chat.

**Alternative:** Explicit `mode` prop — rejected as redundant.

### 2. Request catalog + legacy document blobs

**Decision:** Client sends `catalog: { articleId, documentUid, title }[]` and `mode`. Server builds context strings from hits (same fields as today) but labels each block with `articleId` = **`document_uid`** (fallback to `hit.id` only if uid missing). Server may still accept `documents: string[]` during transition; catalog is authoritative when present.

**Rationale:** Unifies navigation, citations, and `getAiResponse` patterns.

### 3. Citation extraction: stream then `generateObject` on finish

**Decision:** Keep `streamText` for the assistant answer. On `onFinish`, run `generateObject` with schema `{ citedArticleIds: string[] }` using: user question, assistant text, and catalog listing. Filter returned IDs to **catalog.articleId set**; map to `{ articleId, documentUid, title }` for the client. Attach citations to the UI message via AI SDK **message metadata** or a **custom data stream part** consumed by `ViewModeChat`.

**Rationale:** Preserves streaming UX; reuses existing `generateObject` + Zod stack; post-hoc extraction matches “papers used for this response” without tool-calling complexity in the stream.

**Alternatives considered:**

- Inline JSON in model output — fragile parsing.
- Single `generateObject` (no stream) — worse UX.
- Tool call during stream — harder to validate and test across providers.

### 4. Citation chips UI

**Decision:** New `ChatMessageCitations.vue` (or inline in `ViewModeChat` if small): `UPopover` or disclosure below assistant content. Collapsed: `"{n} articles"` (i18n). Expanded: list of `UButton` / links with document titles. Hidden when `n === 0`. Shown only when `mode === 'corpus'`. Loading state on chip until citations arrive.

**Open article:** Emit `open-article(documentUid)` to parent. Explorer modal: resolve hit or `openDocumentFromQueryParam`. Pinboard modal: navigate to explorer with `?document=` or reuse board’s article opener if added.

### 5. Full conversation pin (snapshot)

**Decision:** Toolbar control “Save conversation” in `ViewModeChat` header/footer. Disabled while `status === 'streaming' | 'submitted'`. On save: `body_kind: chat`, `data: { messages, citationsByMessageId?, sourceView, mode }`. Title from first user message (truncated) + optional date. No update-in-place on subsequent saves (new pin each time).

**Rationale:** Matches user decision “snapshot once”; `PinRenderChat` already renders `messages`.

### 6. Text selection pin on corpus chat

**Decision:** Wrap `ViewModeChat` in `ArticleTextSelectionCapture` in `explorer.vue` and `board/index.vue` modals only. `body_kind: selected_text` with `sourceView: 'chat'`. No per-bubble pin buttons.

**Rationale:** `ArticleViewAI` already wraps the article view including chat.

### 7. Pinboard display of stored citations

**Decision:** v1: `PinRenderChat` unchanged (messages only). Optional follow-up: show citation titles under assistant messages in pin detail if `citationsByMessageId` present — spec’d as ADDED in `human-pins-frontend` delta; implement in same change if time permits, else defer to tasks as optional.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Post-stream citation pass adds latency | Show chip skeleton; typical small schema call |
| Model cites wrong or all catalog IDs | Strict prompt + filter to catalog; empty list allowed |
| Citation pass disagrees with streamed answer | Accept for v1; document as non-legal attribution |
| Large thread pin bodies | Truncate preview in dialog; store full messages with reasonable length cap in builder |
| Board modal cannot open article in-place | Navigate to explorer deep link (documented in tasks) |

## Migration Plan

1. Deploy server changes first (backward compatible: citations optional, catalog optional).
2. Deploy client: catalog + uid alignment, then chips, then pin/save UI.
3. No data migration; existing `chat_response` pins unaffected.

**Rollback:** Revert client to hide chips/save; server ignores catalog field.

## Open Questions

- **Board chat open-article:** In-modal side panel vs navigate to `/explorer/explorer?document=` — default to deep link unless board gains a document panel.
- **Zero citations UI:** Hide chip row entirely (recommended) vs “No specific sources” — default hide.
