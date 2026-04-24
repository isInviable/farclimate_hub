## Context

The explorer already ships a working article side-panel surface:

- `apps/web/app/components/explorer/ArticleSidePanel.vue` wraps `ArticleViewAI` inside a Nuxt UI `USlideover` (`max-w-5xl`, non-modal overlay, `modal: false`), with a small header (title + open-in-new-tab button + close).
- `apps/web/app/pages/explorer/explorer.vue` owns `selectedDocument: Ref<ArticleDetail | null>` and `isSidePanelOpen: Ref<boolean>`, opening the panel in response to document-selection events from the result list, map, and AI view modes.
- Documents are resolvable on demand via `apps/web/server/api/document-by-uid.get.ts`, already used elsewhere when only `document_uid` is known.

On the pinboard side, two surfaces need a way to open an article inside this panel:

1. The map popup from `pinboard-global-map` (one article per marker, already aggregating the user’s pins for that article).
2. Pin cards on the grid (each card already knows its pin’s `source_document_uid`).

Both share the same need: "given an article, open the reader as an in-page drawer, and optionally display the user’s pins from that article alongside." The cleanest shape is to *generalise the existing panel* rather than ship a second reader.

This change is primarily a small refactor + two new call sites, not a new UI surface built from scratch. The design emphasises keeping the panel generic and reusable, avoiding pinboard-specific logic inside `ArticleSidePanel.vue`.

## Goals / Non-Goals

**Goals:**

- Reuse `ArticleSidePanel.vue` as the single article-reader drawer across the explorer and the pinboard.
- Allow callers to open the drawer by passing either a fully-loaded `ArticleDetail` *or* a `document_uid` (the panel resolves it via the existing server route).
- Let callers declare an optional list of `HumanPinRow` belonging to the opened article; when present, the panel renders a dedicated "Your pins from this article" section inside its body.
- Open the drawer from map marker popups (via an **Open article** button added to the popup in this change).
- Open the drawer by clicking a pin card’s body on the grid.
- Preserve existing explorer behavior unchanged: the explorer continues to pass a loaded `ArticleDetail` with no pins context, exactly as today.
- Make the drawer work in read-only mode on the public shared board (no new auth requirements).

**Non-Goals:**

- Inline article editing or new CRUD endpoints.
- Pin creation from within the drawer (that path lives in article views; drawer is read-centric in this change).
- Deep-linkable drawer state (e.g. `?article=<uid>`). Can be added later; keeps this change focused.
- A new `PinBoardArticleDrawer.vue` wrapper. The design settles on direct reuse of `ArticleSidePanel.vue` with additive props.
- Replacing or rewriting `ArticleViewAI.vue`.

## Decisions

1. **Reuse `ArticleSidePanel.vue` directly; add additive props, do not fork.**
   Introduce `documentUid?: string` and `pins?: HumanPinRow[]` as optional props, alongside the existing `document: ArticleDetail` (becoming effectively `document?: ArticleDetail`). Exactly one of `document` or `documentUid` must be provided. When only `documentUid` is given, the panel fetches the article through `$fetch('/api/document-by-uid', { query: { uid: documentUid } })` and renders a small loading state until the response arrives. When `pins` is non-empty, a dedicated section is rendered inside the body.
   *Alternative considered*: create `PinBoardArticleDrawer.vue` that composes `ArticleSidePanel` and adds the pins section. Rejected — duplicates markup, pulls the pins section out of the drawer body where it visually belongs, and adds a second component to maintain.

2. **Pinboard page-level drawer state lives in `PinBoardView.vue`.**
   The component already receives `pins` and owns sidebar/view state; extending it with `openedArticleUid: Ref<string | null>` is local. Both the map popup and card click events bubble up to `PinBoardView`, which sets the state and mounts `ArticleSidePanel` once. Mounting the drawer at the pinboard pages directly was considered and rejected — it would force both pages (`board/index.vue` and `board/public/[id].vue`) to maintain parallel drawer wiring.

3. **`pins` argument is computed when opening the drawer, not fetched.**
   Both call sites already have the full pins list in scope (the view has `props.pins`; the map popup has the group’s pins; a card has access to the full list via the view). On open, `PinBoardView` filters the local `props.pins` by `source_document_uid === openedArticleUid` and passes the result as `pins`. No extra request, and the pins section stays in sync if the list is reloaded.

4. **Card click target is the card body, not the whole card.**
   The current `PinBoardCard.vue` has three interactive zones — overflow menu (top-right), selection toggle (bottom-right), and the body content. The card body wrapper becomes a `button` or `div` with a click handler that emits `open-article` only when `pin.source_document_uid` is set. Clicks on the menu or selection controls stop propagation so they never open the drawer accidentally.
   *Alternative considered*: add a dedicated "Open article" menu entry. Rejected — would hide what should be the primary card action behind a menu.

5. **Map popup gains an "Open article" primary button.**
   The popup content becomes: article title (header), pins list (body, from `pinboard-global-map`), **Open article** button (footer). The button emits `open-article` with `{ documentUid, pins }`. This is the spec’s *additive* extension alluded to in `pinboard-global-map`.

6. **Public board parity: drawer is read-only, same component.**
   `ArticleViewAI` already renders read-only by default. No new RLS or auth checks are added; if pin creation affordances live inside `ArticleViewAI` (e.g. `SelectableBlock`), they are already gated by auth elsewhere and remain so. The drawer on the public board therefore shows the article without functioning pin controls for anonymous viewers — consistent with other read-only surfaces.

7. **Degraded pins (no `source_document_uid`) are explicitly inert.**
   Cards that render the "source missing" state already visually communicate the issue. The card body click handler does nothing when `pin.source_document_uid` is falsy. Cursor style stays default on those cards to avoid inviting a click.

8. **Loading and error states inside the panel.**
   When `documentUid` is supplied but resolution is in flight, the slideover header shows the raw title (if available from the caller, e.g. `source_title_snapshot` passed as a separate `titleFallback?: string` prop) and the body renders a skeleton / spinner. On fetch failure, the body shows a friendly error message from the i18n namespace (`pins.drawer.loadError`). Previously the panel assumed `document` was always ready; this decision preserves that happy path while gracefully supporting the uid-only case.

9. **Minimal i18n additions.**
   New `pins.drawer.*` keys: `openArticle` (map popup button label), `pinsInArticleHeader` (the "Your pins from this article" section title inside the body), `loadError`, and a `pinsInArticleEmpty` placeholder used only if the caller passes an empty `pins` array explicitly (defensive).

## Risks / Trade-offs

- **[Risk]** `ArticleSidePanel.vue` becoming the "universal drawer" invites feature creep → **Mitigation**: keep additions strictly additive (optional props only), leave explorer behavior unchanged, and enforce "exactly one of `document` / `documentUid`" via a runtime warning in dev.
- **[Risk]** Fetching the document through the existing `/api/document-by-uid` route on every drawer open has latency and re-opens the same article repeatedly → **Mitigation**: lean on the default Nuxt data-cache (or a tiny `Map<uid, ArticleDetail>` in `useState` on the pinboard page) if profiling shows it matters. Not included in v1 tasks.
- **[Risk]** Click-to-open on the card body conflicts with text selection inside cards (e.g. selecting a note to copy) → **Mitigation**: use `click` (not `mousedown`) and detect `window.getSelection()?.toString()`; do not open drawer if the user is actively selecting text.
- **[Trade-off]** The pins section lives inside the panel body, not in a side-by-side split → simpler UX, consistent across viewports, at the cost of requiring the user to scroll within the drawer to see the pins. Acceptable; the list is short.
- **[Trade-off]** No deep-linkable drawer state in v1 → users cannot share a "board + opened article" URL. Can be added later as an additive change without breaking the current surface.
- **[Risk]** The existing `ArticleSidePanel.vue` disables body scroll on mount/unmount; opening it from a popup inside a map may race with Mapbox event handlers → **Mitigation**: already handled by the existing `onMounted`/`onBeforeUnmount` logic; verify manually during implementation and patch only if a regression appears.
- **[Risk]** Public shared board (`/explorer/board/public/[id]`) is broken for reasons unrelated to this change → **Mitigation**: because `PinBoardView` (and therefore the drawer mounted inside it) is shared between private and public board pages, the drawer lights up for the public board automatically when that page is restored. Only the manual verification step for public-board read-only mode is deferred to the change that fixes the public board.

## Migration Plan

Not applicable. Pure frontend change. The drawer’s new props are optional and additive, so the explorer keeps working without edits. The pinboard picks up the drawer when `PinBoardView.vue` is updated; same bundle ships to the private and public board pages.

## Open Questions

- Should the pins section inside the drawer highlight the user’s `user_note` more prominently (e.g. as a callout) to reinforce "this is why you pinned it"? Current lean: yes, bordered block with the note — decided during component build, not spec-critical.
- When the drawer is opened from a card, should the pins list passed to the panel include all sibling pins for the same article, or only the card’s pin? Current lean: **all sibling pins** — consistent with the map popup flow and more useful to the user. Finalize in implementation; tasks currently assume "all siblings".
