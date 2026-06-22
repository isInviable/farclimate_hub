## 1. i18n

- [x] 1.1 Add `tabs.pins` ("Your pins") to `apps/web/i18n/locales/en.json`, `es.json`, and `it.json`.

## 2. ArticlePrimaryNav badge

- [x] 2.1 Extend nav item type with optional `badgeCount?: number`.
- [x] 2.2 Render `UBadge` with `color="error"` and numeric label when `badgeCount > 0`, including on the active tab.

## 3. ArticlePinsSection component

- [x] 3.1 Create `apps/web/app/components/explorer/article/ArticlePinsSection.vue` accepting `pins: HumanPinRow[]`.
- [x] 3.2 For each pin: render localized `body_kind` badge, `PinBodyRenderer` with `body.data`, and `user_note` when non-empty (reuse `pins.userNote` label).
- [x] 3.3 Omit per-pin `source_title_snapshot` heading; use scrollable list layout consistent with contacts tab density.

## 4. ArticleViewAI integration

- [x] 4.1 Add optional `pins?: HumanPinRow[]` prop and `articlePins` computed (explicit prop or filter `usePinsSupabase` by `pinDocumentUid`).
- [x] 4.2 Extend `PrimaryId` with `"pins"`; append **Your pins** to `primaryItems` only when `articlePins.length > 0`, with `badgeCount`.
- [x] 4.3 Add pins `role="tabpanel"` with `ArticlePinsSection`; match contacts tab scroll behavior.
- [x] 4.4 Watch `articlePins.length`: when it becomes 0 while `activePrimaryId === "pins"`, reset to `"recipe"`.
- [x] 4.5 Remove `<slot name="pins-after" />` from template.

## 5. ArticleSidePanel cleanup

- [x] 5.1 Remove `#pins-after` template block (teal footer section).
- [x] 5.2 Forward `:pins="pins"` prop to `ArticleViewAI` when `pins` is provided.

## 6. Verification

- [x] 6.1 Manual QA: open article from pin board (grid + map) — **Your pins** tab shows grouped pins with `PinBodyRenderer` and count badge.
- [x] 6.2 Manual QA: open article from explorer with existing pins for that document — tab appears without passing explicit `pins` prop.
- [ ] 6.3 Manual QA: create a pin in-article while modal open — tab appears or count updates.
- [x] 6.4 Manual QA: article with no pins — no **Your pins** tab, no footer block.
- [ ] 6.5 Manual QA: public shared board article drawer — pins tab still works via explicit `pins` prop.
