## Why

The legacy `Pin` component (`explorer/ui/pin/Pin.vue`) was removed while **`ViewModeListSimple`** and **`ViewModeInstagram`** still referenced `<Pin>`, causing runtime resolution failures. Explorer search surfaces must align with the capturable pinning model already used elsewhere (`CapturableBlock`, `PinCaptureDialog`, structured `human.pins`), consistent with `explorer-viewmode-grid-compare`.

## What Changes

- Replace `<Pin>` wrappers in **`ViewModeListSimple.vue`** with **`CapturableBlock`** (and shared **`PinCaptureDialog`** semantics via that component), supplying **`PinArticleContext`** per search hit so `source_document_uid` / `source_title_snapshot` are set when the hit has a document UID.
- Replace `<Pin>` in **`ViewModeInstagram.vue`** (bookmark control) with the same capturable approach; preserve UX (e.g. Instagram-style icon vs list title chrome) via **`CapturableBlock`** `chrome` / **`#pin` slot** overrides where needed.
- **`grep`** the web app for any remaining `<Pin>` / legacy pin wrapper references and migrate or remove them.
- **No backend API changes**; pins continue to use `usePin` + `human.pins` as today.

## Capabilities

### New Capabilities

- `explorer-search-viewmode-pin-capture`: Normative rules for pinning from **list** and **Instagram** explorer viewmodes: capturable flow only, per-hit article context, no legacy `Pin` component, alignment with `human-pins-frontend` source-document rules.

### Modified Capabilities

- None at the formal spec level (existing `human-pins-frontend` and `explorer-viewmode-instagram` behaviors are extended by the new capability rather than rewriting prior requirement blocks).

## Impact

- **Frontend**: [`apps/web/app/components/explorer/wf/viewmodes/ViewModeListSimple.vue`](apps/web/app/components/explorer/wf/viewmodes/ViewModeListSimple.vue), [`apps/web/app/components/explorer/wf/viewmodes/ViewModeInstagram.vue`](apps/web/app/components/explorer/wf/viewmodes/ViewModeInstagram.vue); possible reuse of [`ViewModeGridHitContext.vue`](apps/web/app/components/explorer/wf/viewmodes/ViewModeGridHitContext.vue) or equivalent `provide(PinArticleContextKey)` per hit.
- **Dependencies**: Existing [`CapturableBlock.vue`](apps/web/app/components/explorer/CapturableBlock.vue), [`pinContext.ts`](apps/web/app/components/explorer/pinContext.ts), [`usePin`](apps/web/app/composables/usePin.ts).
- **Specs**: New delta spec folder under this change for `explorer-search-viewmode-pin-capture`.
