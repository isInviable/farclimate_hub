## Why

When an article has pins, they currently render as a footer block below all primary tabs in `ArticleViewAI` (via the `#pins-after` slot in `ArticleSidePanel`). That section consumes significant vertical space on every tab—especially the long recipe scroll stack—and pushes primary content off-screen. Pins deserve their own discoverable surface without penalizing recipe, chat, or contacts reading.

## What Changes

- Add a fourth primary tab **"Your pins"** to `ArticleViewAI`, positioned after **Contact and references**, visible only when the opened article has at least one pin.
- Show a red **count badge** on the tab at all times (including when the tab is active).
- Introduce `ArticlePinsSection.vue` as a dedicated component that lists pins with full `PinBodyRenderer` previews (same richness as the pin board) plus `user_note` when present.
- Remove the `#pins-after` slot and the inline teal footer pins block from `ArticleSidePanel`.
- Resolve pins for the current article inside `ArticleViewAI`: use an optional `pins` prop when callers provide it (pin board / public board), otherwise filter the shared `usePinsSupabase` store by `source_document_uid` (explorer parity with no `explorer.vue` changes).
- Add `tabs.pins` i18n key ("Your pins") in EN/ES/IT.
- Structure `ArticlePinsSection` for future in-tab note editing (not implemented in v1).
- **Out of scope for v1**: note editing UI, full-page `/articles/[id]` pin loading, removing redundant `:pins` from `PinBoardView`.

## Capabilities

### New Capabilities

- `article-pins-tab`: Primary-tab presentation of per-article pins inside `ArticleViewAI`, including conditional visibility, badge, scrollable panel, and pin body rendering.

### Modified Capabilities

- `human-pins-frontend`: Replace the drawer body's footer "pins-in-article" section with the article view's pins primary tab; extend explorer usage so pins appear when the global pin store has rows for the opened document.

## Impact

- `apps/web/app/components/explorer/ArticleViewAI.vue` — new tab, pins resolution, remove slot
- `apps/web/app/components/explorer/article/ArticlePrimaryNav.vue` — badge support
- `apps/web/app/components/explorer/article/ArticlePinsSection.vue` — **new**
- `apps/web/app/components/explorer/ArticleSidePanel.vue` — remove `#pins-after` template; optional simplification of `pins` prop passthrough
- `apps/web/i18n/locales/{en,es,it}.json` — `tabs.pins`
- `openspec/specs/human-pins-frontend/spec.md` — delta at archive time
- No database, API, or RLS changes
