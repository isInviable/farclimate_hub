## Why

The pinboard groups pins into UI-only sections by `body_kind` (text segment, image, contact, website, chat…) but offers no spatial view of the user’s saved research. An earlier idea proposed a dedicated `map` pin body kind, but a map is not a *type of content* a user pins — it is a *projection* of the whole collection. Users would benefit more from a single global map that plots every saved article by its existing `document.location`, turning the pinboard into a research map as well as a research list.

## What Changes

- Add a **`🗺 Map`** entry in the pinboard sidebar (`PinBoardView.vue`), visually separated from the `body_kind` section list.
- When **Map** is selected, swap the main grid for a Mapbox-based map (reusing the `MapBase.vue` pattern) that renders **one marker per unique `source_document_uid`**, not one marker per pin.
- Marker popup on click SHALL show the article title (from any pin’s `source_title_snapshot`) and the list of the user’s pins for that article (kind label + optional note excerpt). No outbound link, no drawer — those arrive in the follow-up change `pinboard-article-drawer`.
- Introduce a **snapshot-on-create** convention: when a pin is created from a UI surface that knows the parent `document.location`, the client SHALL include `location: [lat, lon]` inside `body.data`. No DB migration; `body` remains a `v: 1` envelope.
- Update every article-aware pin-creation entry point to write this snapshot when coordinates are valid.
- The **Map** sidebar entry displays a count equal to the number of **unique articles with a location** (not the number of pins). When that count is zero the entry SHALL be **disabled** with a tooltip.
- The `body_kind` filter in the sidebar SHALL **not** filter the map; the map is always a global view of pins-with-location.
- The public shared board (`/explorer/board/public/[id].vue`) SHALL expose the same map view, read-only.
- **No backfill** of existing pins: only pins created after this change ships appear on the map.

## Capabilities

### New Capabilities

- _(none — this extends the existing pinboard spec.)_

### Modified Capabilities

- `human-pins-frontend`: the pinboard frontend SHALL offer a global map view alongside the body-kind sections, use a `body.data.location` snapshot written at pin creation as the data source, and render one marker per unique source document.

## Impact

- **Components**:
  - `apps/web/app/components/explorer/wf/pin-board/PinBoardView.vue` — add Map sidebar entry, main-area view switching.
  - New `apps/web/app/components/explorer/wf/pin-board/PinBoardMap.vue` — groups pins by `source_document_uid`, renders markers, handles popup.
  - Pin creation entry points that already know article context: `ArticleViewAI.vue`, `ArticleSummaryView.vue`, image gallery / lightbox pin flows, `SelectableBlock` pins under an article — all SHALL include `location` in `body.data` when the parent document has valid coordinates.
- **Composables / utils**:
  - New grouping helper (e.g. `utils/pinBoardMap.ts`) to derive `{ documentUid, title, location, pins[] }` groups from `HumanPinRow[]`.
  - `usePinsSupabase.createPin` callers updated at their call sites; no public API change.
- **Types**: `PinBodyV1.data` is `Record<string, unknown>` today; document (not enforce) that `location?: [number, number]` is a recognised snapshot field.
- **Pages**: `apps/web/app/pages/explorer/board/index.vue` and `apps/web/app/pages/explorer/board/public/[id].vue` get the same updated `PinBoardView`.
- **i18n**: new `pins.map.*` keys (sidebar label, empty state, popup strings) for `en` and `es`.
- **External deps**: `mapbox-gl` and Mapbox access token are already wired (`MapBase.vue`, `ViewModeMap.vue`); no new dependency.
- **Out of scope** (handled in the follow-up change `pinboard-article-drawer`): the side-panel article reader triggered from the popup or pin cards.
