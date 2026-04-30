## 1. Types and payload wiring

- [x] 1.1 Add `markmap` to `PinCaptureBodyKind` in `apps/web/app/types/pinCapture.ts` and document `body.data` fields (`markdown`, optional `yaml`) in `apps/web/app/types/pins.ts` comment block if needed.
- [x] 1.2 Extend `usePinsSupabase.ts` (`mapBodyKindToBoardType`, `boardDataFromPin`) so `markmap` pins map to a stable board item type and card previews receive markdown (mirroring `grid_compare_summary` patterns).

## 2. Markmap viewer ergonomics

- [x] 2.1 Add optional props to `MarkmapViewer.client.vue` (e.g. `showToolbar`, `autoFit`) so pin previews can disable the floating toolbar and avoid duplicate chrome when embedded in small cards.
- [x] 2.2 If the default YAML is always injected internally, decide whether persisted pins store only user-visible markdown or also custom YAML; align props/emit so the parent can read the same string(s) used for `transformer.transform`.

## 3. Explorer capture UX

- [x] 3.1 In `apps/web/app/pages/explorer/explorer.vue`, add an authenticated-only control in the mind map modal header that opens the pin capture flow with `bodyKind: "markmap"`, `data: { markdown, yaml? }`, and `title` / `sourceDocumentUid` / `location` derived from existing explorer state (`getDocumentUidFromQuery`, current article detail if available).
- [x] 3.2 Wire `PinCaptureDialog` (or shared composable) for save/cancel: on confirm call `usePin().pinCapture` with the structured payload; toast or refresh pins list per existing explorer patterns.

## 4. Pinboard rendering

- [x] 4.1 Add `PinRenderMarkmap.client.vue` (or equivalent) that wraps `MarkmapViewer` with bounded height and passes stored `markdown` / `yaml`.
- [x] 4.2 Register the renderer in `PinBodyRenderer.vue` for `body_kind === "markmap"`.
- [x] 4.3 Extend `PinCaptureDialog` preview (optional slot or truncated markdown) so users see a meaningful preview before save when `bodyKind` is `markmap`.

## 5. i18n and tests

- [x] 5.1 Add `pins.kinds.markmap` (and any capture strings) to the web app locale files alongside other `pins.kinds.*` keys.
- [x] 5.2 Add a unit test in `apps/web/tests/pins/` for `buildPinCapturePayload` with `bodyKind: "markmap"` and sample markdown; add or extend a shallow test that `PinBodyRenderer` resolves `markmap` to the markmap component if the project uses such tests.
