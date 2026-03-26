## Context

The web app uses Nuxt 4, `@nuxt/ui` v4, `ai` v6, and `@ai-sdk/vue` for the explorer’s document chat (`ViewModeChat.vue`). The server route `server/api/chat.ts` still used the removed `streamText` helper `toDataStreamResponse()`, while `Chat` from `@ai-sdk/vue` consumes the **UI message stream** produced by `toUIMessageStreamResponse()`. The UI predates Nuxt UI’s chat components and duplicates layout that `UChatMessage` / `UChatMessages` already encode (side, variant, parts).

## Goals / Non-Goals

**Goals:**

- Restore a working streaming chat against Gemini with no 500s on `/api/chat`.
- Align the server with AI SDK 6 chatbot docs: `convertToModelMessages` + `toUIMessageStreamResponse`.
- Present messages with Nuxt UI chat components and `parts` in the AI SDK shape (text, and any future part types the app needs).
- Preserve `documents` in the POST body to build the system context (RAG-style grounding).

**Non-Goals:**

- Changing search, embeddings, or article data models.
- Adding auth or rate limiting to `/api/chat` (can be a follow-up).
- Tool calling or multi-modal attachments unless already required by current UX.

## Decisions

1. **Server streaming API** — Use `toUIMessageStreamResponse()` on the `streamText` result. **Rationale:** Matches `@ai-sdk/vue` `Chat` and [AI SDK UI chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) examples. **Alternative:** `TextStreamChatTransport` + plain text stream — rejected; would lose structured parts and diverge from existing client.

2. **Message conversion** — Use `convertToModelMessages(messages)` from `ai` for the `messages` array from the client. **Rationale:** Client sends `UIMessage[]` with `parts`; the model API expects core model messages. **Alternative:** Manual mapping — rejected; brittle and duplicates SDK logic.

3. **Nuxt UI composition** — Prefer `UChatMessages` + `UChatMessage` (see [ChatMessage](https://ui.nuxt.com/docs/components/chat-message)) bound to `chat.messages` and each message’s `parts`. **Rationale:** Consistent with project rules (Nuxt UI first) and documented AI SDK `parts` format. **Alternative:** Keep custom flex bubbles — rejected per user request.

4. **Markdown in assistant text** — If plain `UChatMessage` does not render Markdown, use the `content` slot (or documented slot) to run existing `markdown-it` output **only for assistant text**, with the same trust assumptions as today (model output). **Alternative:** Strip markdown — rejected; degrades readability.

5. **Error surface** — Optionally pass `onError` to `toUIMessageStreamResponse` to return a safe client-visible message (per AI SDK docs). **Rationale:** Avoid raw provider errors in production while keeping dev clarity.

## Risks / Trade-offs

- **`v-html` + Markdown** — [Risk] XSS if content ever includes untrusted HTML. → [Mitigation] Keep rendering only for assistant model output; prefer sanitization or `@nuxtjs/mdc`/prose pipeline in a later hardening change.
- **Part type drift** — [Risk] AI SDK renames part kinds (e.g. tool UI). → [Mitigation] Type `parts` narrowly; fall back to generic display for unknown types.
- **Styling inside chat palette** — [Risk] `UChatPalette` vs plain layout differences. → [Mitigation] Match parent container height/scroll to current `80vh` pattern; use Nuxt UI docs “Chat” overview for recommended wrapper.

## Migration Plan

1. Deploy server change first (or same PR): old clients calling `/api/chat` with legacy stream expectations would break — in this repo only `ViewModeChat` + `Chat` are consumers, so ship both together.
2. Verify manually: open explorer chat, send message, confirm stream completes and examples still send `documents`.
3. Rollback: revert `chat.ts` + `ViewModeChat.vue` in one commit.

## Open Questions

- Whether to wrap the whole block in `UChatPalette` for compact density; confirm against current explorer layout and Nuxt UI chat examples.
- Whether i18n strings for “AI is typing…” / errors should move to keys (optional cleanup).
