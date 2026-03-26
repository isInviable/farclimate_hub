## 1. Server: AI SDK 6 chat stream

- [x] 1.1 Update `apps/web/server/api/chat.ts` to import `convertToModelMessages` (and types as needed) from `ai`, build `messages` for `streamText` via `await convertToModelMessages(messages)` (or sync API per installed `ai` version).
- [x] 1.2 Replace `result.toDataStreamResponse()` with `result.toUIMessageStreamResponse()`; add optional `onError` for safe client-facing errors.
- [x] 1.3 Manually verify `POST /api/chat` returns 200 and streams without throwing (e.g. dev server + explorer chat).

## 2. Client: Nuxt UI chat presentation

- [x] 2.1 Refactor `ViewModeChat.vue` message list to use Nuxt UI chat components (`UChatMessages` / `UChatMessage` or chat palette pattern from Nuxt UI docs) bound to `chat.messages` and each message’s `parts`.
- [x] 2.2 Preserve example questions, `documents` body on `sendMessage`, local `input`, submit/disabled rules, and scroll-to-bottom behavior.
- [x] 2.3 Render assistant text with Markdown where needed (slot or prose) without breaking Nuxt UI layout; handle unknown `parts` gracefully.

## 3. Verification

- [x] 3.1 Run `pnpm --filter web typecheck` (or project-equivalent) and fix any TS issues from API/UI changes.
- [x] 3.2 Smoke-test explorer chat: new message, example question, with and without document context.
