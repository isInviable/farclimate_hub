## Why

The pinboard lets the user see their saved fragments (grid view) and, with `pinboard-global-map`, see where in the world those articles live (map view) — but there is no way to read the underlying article without leaving the board page for the explorer. The explorer already has a perfectly good side-panel reader (`ArticleSidePanel.vue` wrapping `ArticleViewAI`) that opens as a `USlideover`. The pinboard should offer the same affordance so users can move between *their curated collection* and *the underlying content* without a context switch, and so the map markers from `pinboard-global-map` have a natural click destination.

## What Changes

- **Lift `ArticleSidePanel.vue` into a reusable surface** that works equally well on the explorer and on the pinboard pages. The current component is already generic around `ArticleDetail`; the change is mostly about (a) confirming it has no explorer-only assumptions, (b) extracting any that exist, (c) wiring a document-resolver so callers can pass a `document_uid` and let the panel fetch the `ArticleDetail` itself.
- **Add an optional "pins context"** to the panel: when the panel is opened with a list of `HumanPinRow` belonging to the currently-viewed article, the panel SHALL render a small dedicated section (inside its body) that lists those pins — their body kind, a note excerpt if present, and a visual cue tying them to the article.
- **Hook the drawer to the pinboard map marker popup** from `pinboard-global-map`: the popup gains an **Open article** button that, when clicked, opens the drawer on the pinboard with that article’s content plus the group’s pins.
- **Hook the drawer to pin cards on the grid**: clicking a `PinBoardCard` (outside its overflow menu and selection controls) SHALL open the drawer for that pin’s source article. For pins whose `source_document_uid` is missing (degraded "source missing" state), the card SHALL remain inert to click (no drawer).
- Drawer state (open flag + selected article + selected pins) SHALL live at the pinboard page level, so it is shared between the map and the grid and survives switching views.
- The drawer SHALL be available on the private authenticated board and on the public shared board, read-only in the latter (existing `ArticleViewAI` respects read-only contexts).

## Capabilities

### New Capabilities

- _(none — this extends the existing pinboard spec and reuses the existing article-reader component.)_

### Modified Capabilities

- `human-pins-frontend`: the pinboard frontend SHALL provide an in-page side-panel article reader opened from map markers and from pin cards, optionally showing the user’s pins from the viewed article alongside the article content.

## Impact

- **Components**:
  - `apps/web/app/components/explorer/ArticleSidePanel.vue` — make the component callable from the pinboard. If it has explorer-only behaviours, generalise (e.g. accept an optional `pins` slot/prop; accept either a `document` or a `documentUid` + loader).
  - New `apps/web/app/components/explorer/wf/pin-board/PinBoardArticleDrawer.vue` (thin wrapper) if a pinboard-specific wrapping is clearer than re-using the panel directly — decision deferred to the design phase.
  - `apps/web/app/components/explorer/wf/pin-board/PinBoardView.vue` — expose an `openArticle(uid, pins)` affordance and mount the drawer once at the view root.
  - `apps/web/app/components/explorer/wf/pin-board/PinBoardMap.vue` (from `pinboard-global-map`) — the popup gains an **Open article** button emitting an event consumed by `PinBoardView`.
  - `apps/web/app/components/explorer/wf/pin-board/PinBoardCard.vue` — make the card body clickable (not the overflow button or the selection toggle); emit an event picked up by the view.
- **Pages**:
  - `apps/web/app/pages/explorer/board/index.vue` and `apps/web/app/pages/explorer/board/public/[id].vue` — no structural change expected; drawer lives inside `PinBoardView`.
- **Server routes**:
  - Reuse the existing `server/api/document-by-uid.get.ts` to resolve articles on demand. No new endpoint.
- **i18n**: new `pins.drawer.*` keys (title, close, pins-in-article header, open-article button label used from the map popup).
- **Out of scope**: Article editing, pin creation from the drawer, or deep-linking (e.g. `?article=<uid>`). Can be revisited after this change lands.
