## Why

The explorer document chat fails at runtime: the server calls `toDataStreamResponse()` on `streamText`, which is not available on the current Vercel AI SDK (`ai` v6) result type, so `/api/chat` returns 500. The client already uses `@ai-sdk/vue` `Chat` with `parts`-based messages, which expects the **UI message stream** protocol. Separately, the chat UI is hand-built instead of Nuxt UI chat primitives, which makes it harder to align with documented AI SDK + Nuxt UI patterns.

## What Changes

- Update `apps/web/server/api/chat.ts` to stream responses with **`toUIMessageStreamResponse()`** and to pass model-ready messages via **`convertToModelMessages()`** (preserving existing `documents` body → system context behavior).
- Refactor `apps/web/app/components/explorer/wf/viewmodes/ViewModeChat.vue` to render messages with **Nuxt UI chat components** (e.g. `UChatMessages` / `UChatMessage` or the documented chat palette pattern) while keeping `@ai-sdk/vue` `Chat` for transport and state.
- Keep RAG-style behavior: optional `documents` array in the request body continues to augment the system prompt; responses stay grounded per current rules.

## Capabilities

### New Capabilities

- `explorer-document-chat`: End-to-end behavior of the explorer’s document-scoped chat: HTTP API contract with the AI SDK UI stream, client integration with `@ai-sdk/vue` `Chat`, and presentation using Nuxt UI chat components.

### Modified Capabilities

- (none) — no existing OpenSpec capability defines this chat; requirements are introduced fresh under `explorer-document-chat`.

## Impact

- **Code**: `apps/web/server/api/chat.ts`, `apps/web/app/components/explorer/wf/viewmodes/ViewModeChat.vue` (and any parent layout only if required for chat palette styling).
- **Dependencies**: No new packages expected; uses existing `ai`, `@ai-sdk/vue`, `@nuxt/ui`.
- **API**: Same route (`POST /api/chat`) and body shape (`messages`, optional `documents`); response encoding changes from broken legacy stream helper to UI message stream (client already expects modern protocol).
