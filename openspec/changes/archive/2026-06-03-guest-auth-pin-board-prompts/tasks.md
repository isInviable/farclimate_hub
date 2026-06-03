## 1. Auth prompt infrastructure

- [x] 1.1 Add `AuthPromptContext` type and `promptAuthForPersistence(context, returnPath?)` to `useAccess.ts` (modal state: open, context, returnPath)
- [x] 1.2 Create `AuthRequiredModal.vue` using `UModal` with context-driven title/body, Log in / Register link to `/login?returnTo=...`, and Cancel
- [x] 1.3 Mount `AuthRequiredModal` in `layouts/explorer.vue` wired to composable state
- [x] 1.4 Add i18n keys under `auth.prompt.*` in EN, ES, and IT (pinTitle, pinBody, boardTitle, boardBody, signInAction, cancel)

## 2. Pin capture intercepts

- [x] 2.1 Guard `CapturableBlock.openCapture()` with `promptAuthForPersistence('pin')`
- [x] 2.2 Guard `ArticleTextSelectionCapture.openCapture()` with `promptAuthForPersistence('pin')`
- [x] 2.3 Guard `ViewModeChat.openConversationPin()` with `promptAuthForPersistence('pin')`
- [x] 2.4 Guard `ArticleViewAI.openDocumentPinDialog()` with `promptAuthForPersistence('pin')`
- [x] 2.5 Guard `explorer.vue` `openMindmapPinCapture()` with `promptAuthForPersistence('pin')`
- [x] 2.6 Remove `v-if="isAuthenticated"` from mindmap pin button in `explorer.vue`
- [x] 2.7 Remove auth-based hiding in `ArticleSidePanel` (`canPinDocument`) so Pin document is always visible

## 3. Private pinboard access

- [x] 3.1 Update `DeliverableHeader.vue` board control: intercept click with `promptAuthForPersistence('board')`, navigate on success
- [x] 3.2 Add route middleware or page guard on `pages/explorer/board/index.vue` redirecting unauthenticated users to `/login?returnTo=/explorer/board`
- [x] 3.3 Verify `/explorer/board/public/[id].vue` is excluded from the auth guard

## 4. Verification

- [x] 4.1 Manual QA: guest pin click shows modal; Cancel stays on page; login link includes returnTo
- [x] 4.2 Manual QA: guest header board click shows board modal; direct `/explorer/board` URL redirects to login
- [x] 4.3 Manual QA: authenticated pin and board flows unchanged; public board URL works without login
- [x] 4.4 Optional: add Vitest for `promptAuthForPersistence` return values and board middleware redirect logic
