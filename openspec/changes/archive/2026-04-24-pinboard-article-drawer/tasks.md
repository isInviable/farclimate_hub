## 1. Generalise `ArticleSidePanel.vue`

- [x] 1.1 In `apps/web/app/components/explorer/ArticleSidePanel.vue`, change the props to accept `document?: ArticleDetail`, `documentUid?: string`, `titleFallback?: string`, `pins?: HumanPinRow[]`, and keep `open: boolean`. Enforce at runtime (dev-only warn) that exactly one of `document` / `documentUid` is provided.
- [x] 1.2 Add internal state `resolvedDocument = ref<ArticleDetail | null>(props.document ?? null)` and `loadError = ref<string | null>(null)`. Add a watcher on `documentUid` that, when defined and different from the resolved doc, calls `$fetch('/api/document-by-uid', { query: { uid: documentUid } })` and updates `resolvedDocument` (or `loadError`).
- [x] 1.3 Replace the body template so it renders: (a) a loading skeleton while `documentUid` is pending, (b) an i18n error alert when `loadError` is set, (c) the existing `ArticleViewAI :document="resolvedDocument" :show-sidebar="false"` when ready, followed by (d) a new pins section when `props.pins?.length > 0`.
- [x] 1.4 In the header, render the article title from `resolvedDocument.title` when present, otherwise from `props.titleFallback`, otherwise a neutral fallback.
- [x] 1.5 Audit the existing explorer call site in `apps/web/app/pages/explorer/explorer.vue` to confirm it still works unchanged with the additive props (no pins, `document` supplied).

## 2. Pins-in-article section inside the panel

- [x] 2.1 Create a small subcomponent (or inline block) inside `ArticleSidePanel.vue` that renders each `HumanPinRow` passed via `props.pins`: localized `pins.kinds.*` label, truncated note preview (same excerpt rule as the map popup from `pinboard-global-map`), and a subtle divider between rows.
- [x] 2.2 Give the pins section a heading `pins.drawer.pinsInArticleHeader` and a small count (e.g. `(3)`) next to the title.
- [x] 2.3 If the user’s note is long, render it with `whitespace-pre-wrap` and allow full display — this is the drawer, not a card, so we can be generous.
- [x] 2.4 Make the pins section visually distinct from the article content (e.g. bordered box, soft background) so the user understands the two come from different sources.

## 3. Pinboard page-level drawer state in `PinBoardView.vue`

- [x] 3.1 In `apps/web/app/components/explorer/wf/pin-board/PinBoardView.vue`, add `openedArticleUid = ref<string | null>(null)` and a derived `openedArticlePins = computed(() => openedArticleUid.value ? props.pins.filter(p => p.source_document_uid === openedArticleUid.value) : [])`.
- [x] 3.2 Add a `titleFallback` derived from the first of those pins’ `source_title_snapshot` (useful while the article loads).
- [x] 3.3 Mount `<ArticleSidePanel :open="openedArticleUid !== null" :documentUid="openedArticleUid" :titleFallback="titleFallback" :pins="openedArticlePins" @close="openedArticleUid = null" />` once at the root of the `PinBoardView` template.
- [x] 3.4 Expose an internal `openArticle(uid: string)` function used by both the map popup handler and the card click handler.

## 4. Map marker popup gains an **Open article** button

- [x] 4.1 In `apps/web/app/components/explorer/wf/pin-board/PinBoardMap.vue` (introduced by `pinboard-global-map`), add an **Open article** button (primary variant) to the popup footer; disable the button if `documentUid` is missing (defensive).
- [x] 4.2 The button emits `open-article` with `{ documentUid, pins }`; `PinBoardMap.vue` re-emits the event from the template so `PinBoardView` can listen.
- [x] 4.3 `PinBoardView.vue` listens to `@open-article` on the map and calls `openArticle(documentUid)`.

## 5. Pin cards become clickable

- [x] 5.1 In `apps/web/app/components/explorer/wf/pin-board/PinBoardCard.vue`, wrap the main body (the content below the pinned source link, including title, body renderer, and note) in a clickable button-like element that emits `open-article` with the card’s `pin.source_document_uid` — only when set. Keep the overflow menu, selection toggle, kind badge, and `Open in explorer` link as **stop-propagation** zones.
- [x] 5.2 Change the cursor to `pointer` on the clickable body only when `pin.source_document_uid` is set; leave default otherwise.
- [x] 5.3 Avoid opening the drawer when the user is actively selecting text: guard the click handler with `if (window.getSelection()?.toString()) return;`.
- [x] 5.4 `PinBoardView.vue` listens for the `open-article` event on each card (via the grid template) and calls `openArticle(uid)`.

## 6. Internationalization

- [x] 6.1 Add `pins.drawer.openArticle` (used by the map popup button) to `apps/web/i18n/locales/en.json` and `es.json`.
- [x] 6.2 Add `pins.drawer.pinsInArticleHeader`, `pins.drawer.loadError`, and any loading-state string used by the panel skeleton.
- [x] 6.3 Reuse existing `pins.kinds.*` for pin rows inside the drawer.

## 7. Manual verification

- [X] 7.1 On an authenticated account with pins spanning multiple articles, switch to Map view and click a marker → **Open article**; confirm the drawer opens with the article and the group’s pins listed alongside.
- [x] 7.2 In Grid view, click a pin card body; confirm the drawer opens for that article with all sibling pins shown.
- [x] 7.3 Click the overflow menu on a card; confirm the drawer does NOT open and the menu works as before.
- [x] 7.4 Click the selection toggle on a card; confirm selection toggles and the drawer does NOT open.
- [ ] 7.5 Click a card whose pin has no `source_document_uid`; confirm the drawer does NOT open and the "source missing" UI remains visible.
- [ ] 7.6 **Deferred.** Public shared board is broken for reasons unrelated to this change; manual verification of the drawer from map markers and card clicks on `/explorer/board/public/[id]` is postponed to the change that restores that page. The drawer inherits through the shared `PinBoardView` component, so no code change inside *this* change is required for public-board parity.
- [x] 7.7 Open the explorer and confirm its existing `ArticleSidePanel` usage still behaves as before (no regression from the additive props).
