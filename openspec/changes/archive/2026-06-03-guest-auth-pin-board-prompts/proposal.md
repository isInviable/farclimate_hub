## Why

GitHub issue [#14](https://github.com/isInviable/farclimate_data_pipelines/issues/14): unregistered users can interact with pin and pinboard affordances in the explorer without understanding that persistence requires an account. Pin dialogs open and fail silently; the private board route loads empty with misleading copy. We need clear, consistent guidance toward registration while keeping anonymous exploration fully open.

## What Changes

- Add a reusable **auth-required modal** with context-specific copy (pin vs board) and two actions: **Log in / Register** and **Cancel**.
- **Show pin buttons** to guest users (remove auth-gated hiding on document pin, mindmap pin, etc.); intercept on click with the pin-context modal explaining that the pinboard saves content for future analysis or sharing.
- Intercept **header navigation to the private pinboard** (`/explorer/board`) with the board-context modal before navigation.
- **Redirect direct URL access** to `/explorer/board` (typed URL, bookmark) to `/login?returnTo=...` when unauthenticated.
- Extend `useAccess` with a global **`promptAuthForPersistence(context)`** API (modal-first) alongside the existing redirect-based `requireAuthForPersistence` (for programmatic/deep-link cases).
- Wire pin capture entry points through the auth prompt: `CapturableBlock`, `ArticleTextSelectionCapture`, `ViewModeChat` conversation pin, article document pin, mindmap pin.
- Add i18n strings (EN/ES/IT) for modal titles, bodies, and actions.
- **No change** to public shared boards (`/explorer/board/public/:token`) or anonymous browsing of explorer search/results.

## Capabilities

### New Capabilities

_None — behavior extends existing platform access and pins capabilities._

### Modified Capabilities

- `platform-login-demo-mode`: Persistence gates SHALL present an explanatory modal (not only silent redirect) for interactive pin and board entry points; direct private-board URL access SHALL redirect to login.
- `human-pins-frontend`: Pin affordances SHALL remain visible to guests with modal guidance; private pinboard route SHALL be inaccessible without authentication except via public share tokens.

## Impact

- **Composables**: `apps/web/app/composables/useAccess.ts`
- **New component**: auth-required modal (e.g. `AuthRequiredModal.vue`)
- **Explorer components**: `CapturableBlock.vue`, `ArticleTextSelectionCapture.vue`, `ViewModeChat.vue`, `ArticleSidePanel.vue`, `ArticleViewAI.vue`, `explorer.vue`
- **Header / routing**: `DeliverableHeader.vue`, `apps/web/app/pages/explorer/board/index.vue` (middleware or page guard)
- **i18n**: `apps/web/i18n/locales/{en,es,it}.json`
- **Tests**: composable and middleware behavior (optional Vitest)
