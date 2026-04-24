## 1. Types, utilities, and grouping

- [x] 1.1 In `apps/web/app/types/pins.ts`, document (in a comment) that `body.data` MAY carry `location?: [number, number]` as a snapshot of the parent document’s coordinates; do not narrow `PinBodyV1` to enforce it.
- [x] 1.2 Create `apps/web/app/utils/pinBoardMap.ts` exposing `groupPinsForMap(pins: HumanPinRow[]): PinMapGroup[]` where a `PinMapGroup = { documentUid: string; title: string; location: [number, number]; pins: HumanPinRow[] }`.
- [x] 1.3 In the same util, implement `isValidPinLocation(loc: unknown): loc is [number, number]` following explorer rules: tuple of two finite numbers, latitude in `[-90, 90]`, longitude in `[-180, 180]`, reject `[0, 0]`.
- [x] 1.4 Ensure `groupPinsForMap` groups by `source_document_uid`, skips groups whose pins all lack a valid `location`, picks the first valid location as the group’s location, and picks `source_title_snapshot` from the first pin in the group (fallback `pins.noTitle` key name, resolved by caller).

## 2. Snapshot-on-create at article-aware call sites

- [x] 2.1 In `apps/web/app/components/explorer/ArticleViewAI.vue` (and any article-wrapper it uses for pin insertion), read `document.location` when creating a pin and, when `isValidPinLocation` passes, include `location` inside the `body.data` payload for every pin kind it creates.
- [x] 2.2 Do the same in `apps/web/app/components/explorer/ArticleSummaryView.vue` for short-description, contact, website and other block pins.
- [x] 2.3 Do the same in the image gallery / lightbox pin flow (`apps/web/app/components/explorer/ArticleView.vue`, `AppImageLightbox.vue`, `PinRenderImage.vue` related insert call, as applicable).
- [x] 2.4 Verify any other call site that currently sets `source_document_uid` from article context also writes `body.data.location` when valid. If a single helper emerges naturally, extract it; otherwise leave per-call-site.
- [x] 2.5 Add a lightweight developer comment near each call site linking to this change, so future contributors know the field is product-relevant (not arbitrary).

## 3. `PinBoardMap.vue` component

- [x] 3.1 Create `apps/web/app/components/explorer/wf/pin-board/PinBoardMap.vue` accepting `pins: HumanPinRow[]` as a prop.
- [x] 3.2 Initialise `mapbox-gl` using `useRuntimeConfig().public.mapbox.accessToken` (mirror `MapBase.vue`); style `mapbox://styles/mapbox/light-v11`, min/max zoom as in `MapBase.vue`, `equalEarth` projection on fit.
- [x] 3.3 Compute groups via `groupPinsForMap(props.pins)`; expose them as a `FeatureCollection<Point>` with `properties.documentUid` for click wiring.
- [x] 3.4 Render markers as `circle` layer matching `MapBase.vue` paint (teal `#00bba7`, radius 6, white stroke 1px) so the two maps look consistent.
- [x] 3.5 On marker hover, show a simple tooltip with the article title.
- [x] 3.6 On marker click, open a popup that renders: title + a list of the group’s pins (one row per pin, each with localized kind via `pins.kinds.*` and a note excerpt truncated to roughly 120 chars with ellipsis when longer).
- [x] 3.7 On `props.pins` change, update the GeoJSON source and call `fitBounds` when the set of group coordinates changes (skip fitBounds on note-only edits).
- [x] 3.8 Handle the empty case defensively: if `groupPinsForMap` returns an empty array, render a centered empty state with `pins.map.emptyBody` (even though the sidebar entry should be disabled in that case).

## 4. `PinBoardView.vue` integration

- [x] 4.1 Add a local `selectedView: Ref<'grid' | 'map'>` with default `'grid'`.
- [x] 4.2 Compute `mapGroups = computed(() => groupPinsForMap(props.pins))` and derive `mapArticleCount = mapGroups.value.length`.
- [x] 4.3 Render a new Map entry in the sidebar, visually separated from the body-kind list (e.g. small divider above it), showing `mapArticleCount` as its count badge.
- [x] 4.4 When `mapArticleCount === 0`, render the Map entry in a disabled state with a tooltip from `pins.map.emptyTooltip`; clicks SHALL not switch views.
- [x] 4.5 Selecting the Map entry sets `selectedView = 'map'`; selecting any body-kind entry sets `selectedView = 'grid'` (keeping existing `selectedKind` behavior intact).
- [x] 4.6 In the main area, branch on `selectedView`: when `'grid'`, render the existing sections / cards; when `'map'`, render `<PinBoardMap :pins="props.pins" />` inside a responsive container (full width, bounded height equivalent to the explorer map, roughly `h-[70vh]`).
- [x] 4.7 Keep the header summary line (`pins.summaryTotal` / `pins.summaryInSection`) when grid view is active; in map view show a dedicated `pins.map.summary` string with the article count.

## 5. Pages and public board parity

- [x] 5.1 Confirm `apps/web/app/pages/explorer/board/index.vue` requires no changes (it already passes `:pins="pinsList"` to `PinBoardView`); add no new logic there.
- [x] 5.2 Confirm `apps/web/app/pages/explorer/board/public/[id].vue` consumes the same `PinBoardView` with the same props; if it diverges, align it so the Map entry and map view appear in public mode as well, read-only.
- [x] 5.3 Verify no map-related controls gate on authentication state in `PinBoardView`/`PinBoardMap`; the feature is purely derived from the `pins` prop.

## 6. Internationalization

- [x] 6.1 Add `pins.map.label`, `pins.map.emptyTooltip`, `pins.map.summary` (with `{count}` interpolation), `pins.map.popupPinsHeader`, `pins.map.noteTruncated` (or similar for excerpt suffix), `pins.map.emptyBody` to `apps/web/i18n/locales/en.json` and `es.json`.
- [x] 6.2 Reuse existing `pins.kinds.*` entries for popup pin rows; add a `pins.kinds.unknown` fallback if missing.

## 7. Manual verification

- [x] 7.1 On an authenticated account with pins, create one new pin from an article whose `document.location` is valid; confirm the persisted `human.pins` row includes `body.data.location` with the correct `[lat, lon]`.
- [x] 7.2 Create a second pin (different kind) from the same article; confirm the Map view shows a single marker at that location and the popup lists two pins.
- [x] 7.3 Create a pin from an article without coordinates; confirm the pin persists normally and the Map view does not gain a marker for that article.
- [x] 7.4 On a board whose pins all predate this change, confirm the Map sidebar entry is disabled with the tooltip.
- [ ] 7.5 **Deferred.** Public shared board (`/explorer/board/public/[id]`) is broken for reasons unrelated to this change; manual verification of the Map view in read-only mode is postponed to the change that restores that page. The Map feature inherits automatically through the shared `PinBoardView` component, so no follow-up work is required inside *this* change — only the verification step is deferred.
- [x] 7.6 Switch between body-kind sections and Map; confirm the Map markers do not change when a kind filter is selected.
