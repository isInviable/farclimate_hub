## Context

The explorer runs in **demo mode** for unauthenticated visitors (`useAccess.isDemoMode`). Persistence writes (pins, projects, saved searches) already fail at the Supabase layer via `requireAuthForPersistence()`, which silently redirects to `/login?returnTo=...`. Pin capture UI (`CapturableBlock`, text selection, chat) opens dialogs without an upfront auth check; saves fail with a generic error. Some pin buttons are hidden (`ArticleSidePanel`, mindmap pin in `explorer.vue`). The private pinboard route `/explorer/board` is reachable by anyone and renders an empty board with misleading copy.

Issue [#14](https://github.com/isInviable/farclimate_data_pipelines/issues/14) requires guiding guests toward registration without restricting anonymous exploration.

## Goals / Non-Goals

**Goals:**

- Show pin affordances to guests so they discover the feature.
- On pin interaction, show a modal explaining the pinboard value proposition and offering login/register or cancel.
- On header click to private pinboard, show a board-specific auth modal before navigation.
- On direct navigation to `/explorer/board` without session, redirect to login with `returnTo`.
- Provide a reusable global auth-prompt API for future persistence gates.
- Preserve public shared boards at `/explorer/board/public/:token`.

**Non-Goals:**

- Migrating every existing `requireAuthForPersistence()` call site to modal-first (share board, export, project create can follow incrementally).
- Gating explorer search, article reading, chat, or insights for guests.
- Adding a separate `/register` route (login page already has sign-up tab).
- Server-side middleware changes beyond a Nuxt route guard on the private board page.

## Decisions

### 1. Two complementary auth gate functions in `useAccess`

| Function | Behavior | Use when |
|----------|----------|----------|
| `promptAuthForPersistence(context)` | If authenticated → `true`. Else open modal → `false`. | User-initiated clicks (pin, board header) |
| `requireAuthForPersistence(returnPath?)` | If authenticated → `true`. Else redirect to login → `false`. | Direct URL access, programmatic writes, existing composables |

**Rationale:** Modal fits interactive discovery; redirect fits bookmarked URLs and low-level persistence guards. Keeps backward compatibility for `usePinsSupabase`, `useProjectsSupabase`, etc.

**Alternative considered:** Replace redirect globally with modal — rejected because direct URL to `/explorer/board` should not flash an empty board before modal.

### 2. Global modal via composable state + single mounted component

- `useAuthPrompt()` (or methods on `useAccess`) holds `ref` for open state, `context`, and optional `returnPath`.
- Mount `AuthRequiredModal` once in the explorer layout (`layouts/explorer.vue`) so any child can trigger it without prop drilling.
- Modal uses Nuxt UI `UModal` with primary `UButton` linking to `/login?returnTo=<encoded path>` and ghost Cancel.

**Rationale:** One modal instance avoids z-index/stacking issues; layout mount covers explorer + board pages.

**Alternative considered:** Per-component modals — rejected as duplicated copy and state.

### 3. Auth prompt contexts (i18n keys)

```ts
type AuthPromptContext = 'pin' | 'board' | 'generic'
```

- **`pin`**: "The pinboard is made to save interesting content for future analysis or sharing. Register or sign in to create your board."
- **`board`**: "Your pinboard collects everything you pin from the explorer. Register or sign in to create and manage your board."
- **`generic`**: fallback for future callers.

Login CTA label: "Log in / Register" → `/login?returnTo=currentPath`.

### 4. Pin intercept at entry points (not only at save)

Wire `promptAuthForPersistence('pin')` at the **open capture** boundary:

| Component | Function |
|-----------|----------|
| `CapturableBlock.vue` | `openCapture()` |
| `ArticleTextSelectionCapture.vue` | `openCapture()` |
| `ViewModeChat.vue` | `openConversationPin()` |
| `ArticleViewAI.vue` | `openDocumentPinDialog()` (exposed to side panel) |
| `explorer.vue` | `openMindmapPinCapture()` |

Remove `v-if="isAuthenticated"` / `canPinDocument` auth hiding; keep buttons visible.

**Rationale:** `CapturableBlock` alone covers list, grid, instagram, article sections, and chat response pins — minimal surface area.

### 5. Private board access

**Header (`DeliverableHeader.vue`):** Replace `NuxtLinkLocale` board toggle with a button/link that `@click.prevent`s and calls `promptAuthForPersistence('board')`; on success, `navigateTo('/explorer/board')`.

**Route guard:** Add middleware `auth-required` (or inline in page) on `pages/explorer/board/index.vue`:

```ts
if (!isAuthenticated.value) {
  return navigateTo(`/login?returnTo=${encodeURIComponent('/explorer/board')}`)
}
```

Exclude `pages/explorer/board/public/[id].vue`.

### 6. i18n

Add under `auth.prompt.*` in EN/ES/IT:

- `pinTitle`, `pinBody`, `boardTitle`, `boardBody`, `signInAction`, `cancel`

Run existing i18n merge script if applicable.

## Risks / Trade-offs

- **[Risk] Double prompt** — user clicks pin, gets modal, cancels, then save path still hits `requireAuthForPersistence` redirect → **Mitigation:** intercept at open; authenticated path unchanged.
- **[Risk] Modal not mounted outside explorer layout** — **Mitigation:** only mount in `layouts/explorer.vue`; board page uses same layout.
- **[Risk] SSR/hydration on route guard** — **Mitigation:** guard runs client-side after `initAuth`; use existing auth init pattern from admin middleware.
- **[Trade-off] Share/export still redirect silently** — acceptable per non-goals; same composable ready for later migration.

## Migration Plan

1. Ship composable + modal + i18n (no wire-up) — safe no-op.
2. Wire pin entry points and unhide buttons.
3. Wire header + board middleware.
4. Manual QA: guest pin click, guest board header, guest direct URL, authed flows, public board URL.

No database migration. Rollback: revert component intercepts; middleware removal restores prior empty-board behavior.

## Open Questions

- None blocking implementation. Optional follow-up: migrate share-board and export flows to `promptAuthForPersistence`.
