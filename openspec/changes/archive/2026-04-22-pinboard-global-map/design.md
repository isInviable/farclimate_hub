## Context

The pinboard (`/explorer/board` and `/explorer/board/public/[id]`) currently renders pins saved by an authenticated user as a grid of `PinBoardCard` components, grouped in UI-only sections by `body_kind`. Pins carry `source_document_uid`, which (when set) resolves to a knowledge document whose `location` field is a `[lat, lon]` tuple. This location data already drives the explorer map view (`ViewModeMap.vue` → `MapBase.vue`, using `mapbox-gl`).

No part of the current pinboard surfaces geography. An earlier idea toyed with a `body_kind: 'map'` pin, but a map is a projection of the collection, not a kind of pinned content. This change turns the pinboard into a second consumer of geographic document data by reusing the same Mapbox patterns already in production.

Key constraints the design must respect:

- `human.pins.body` is a JSON envelope (`{ v: 1, data: {} }`) with intentionally open shape. We can add `body.data.location` without schema changes or RLS changes.
- Several `body_kind` values already persist `body.data` payloads (image pins store src/alt; contact/website pins store structured fields). The new `location` snapshot must coexist without conflicting with existing keys.
- Pin creation happens from multiple entry points (`ArticleViewAI.vue`, `ArticleSummaryView.vue`, image gallery / lightbox, `SelectableBlock`). Each of them already has access to the parent document object in its component state — so reading `document.location` at pin time is a local change, not a plumbing change.
- The public shared board is read-only for unauthenticated viewers and consumes the same pin list; any UI added to `PinBoardView` will appear there automatically.

## Goals / Non-Goals

**Goals:**

- Introduce a **Map** view projection of the pinboard, accessed from the existing `PinBoardView` sidebar.
- Render **one marker per unique `source_document_uid`** (per-article aggregation), not one per pin.
- Keep the click affordance minimal and non-navigational in v1: a popup that shows the article title and the user’s pins for that article. No drawer, no explorer deep-link in v1 (deferred to `pinboard-article-drawer`).
- Establish **`body.data.location: [lat, lon]`** as a recognised snapshot key, populated at pin creation whenever the host surface knows the parent document and its `document.location` is a valid `[number, number]` pair.
- Treat the new sidebar entry as a **view switch**, not a `body_kind` filter — so kind filters in the sidebar do not hide markers.

**Non-Goals:**

- Backfilling existing pins with locations. Existing pins will simply not appear on the map. A backfill can be added later as its own focused change.
- Adding a new DB column, RLS policy, or server route. The change is pure frontend + pin-creation convention.
- Rendering fragment-level markers (per-pin). The product decision is one marker per article; fragments show up inside the marker popup.
- Implementing the side-panel article reader triggered from the popup. That surface lands in change `pinboard-article-drawer`.
- Cluster-heatmap or fancy spiderfy behavior. Stacked markers for articles at the same coordinates are rare; default mapbox overlap is acceptable for v1.
- Changing `PinBodyV1`’s TypeScript shape to enforce `location`. Optional snapshot, not schema-enforced.

## Decisions

1. **View switch lives inside `PinBoardView`’s existing sidebar, not a page-level toggle.**
   The existing sidebar already owns the main-area contents via the `selectedKind` signal. We add a new ref `selectedView: 'grid' | 'map'` and a dedicated **Map** entry in the sidebar (visually separated from the `body_kind` list). Selecting a kind implies `selectedView = 'grid'`; selecting Map implies `selectedView = 'map'`. This keeps the route stable and reuses the one component that both pinboard pages render.
   *Alternative considered*: a separate `PinBoardMap.vue` page under `/explorer/board/map`. Rejected: duplicates layout, splits the component tree, and breaks the single-component contract `board/index.vue` and `board/public/[id].vue` currently share.

2. **Coordinates come from `body.data.location` only; no live document resolution in v1.**
   A pure snapshot approach keeps the map a zero-fetch projection of the already-loaded pin list. Document API joins, N+1 resolution, and server endpoints are avoided. The trade-off is that pins predating this change have no location and do not appear on the map (accepted — see "no backfill").
   *Alternative considered*: resolve lat/lon from the document API on board load. Rejected for v1 because it introduces either N+1 requests or a new joined endpoint; `snapshot-on-create` is the cheapest correct path and matches how `source_title_snapshot` already works.

3. **Per-article aggregation is derived client-side from the in-memory pin list.**
   A small pure utility (`utils/pinBoardMap.ts`) groups pins by `source_document_uid`, filters groups where no pin carries a `body.data.location`, and returns `{ documentUid, title, location, pins: HumanPinRow[] }[]`. `title` is taken from the first pin’s `source_title_snapshot`; `location` is the first pin’s snapshot. If a later pin in the same group has a different location (edge case, e.g. corrected document), the first wins — deterministic and good enough.

4. **Marker rendering builds on the existing Mapbox pattern.**
   We do **not** import `MapBase.vue` as-is because it emits `pinClick` with a single `articleId` and has a hardcoded popup layout. Instead, `PinBoardMap.vue` owns its own `mapbox-gl` instance and popup rendering, mirroring the style decisions already made in `MapBase.vue` (equalEarth projection on fit, light-v11 style, teal `#00bba7` circles). This keeps the explorer component untouched while the pinboard version can render a pin-count badge and a list of pins in the popup.
   *Alternative considered*: generalise `MapBase.vue` with slot/event props. Rejected as premature: the two maps have diverged product requirements (fragments list vs. article label). Generalisation can come later if a third map appears.

5. **Popup content in v1: title + per-pin row, no navigation.**
   The popup shows the article title, the count of pins belonging to it, and a short list of those pins (kind label via `pins.kinds.*` i18n + a short note excerpt if present). No "Open article" button, no "Open in explorer" link. The `pinboard-article-drawer` change will add the button in an additive, backwards-compatible way. Rationale: shipping the map without drawer leaves a useful read-only exploration surface; adding dead links or a "coming soon" button is worse UX than leaving them out.

6. **Sidebar Map entry is a view selector, not a filter.**
   The entry count = number of unique `source_document_uid` groups with a valid location (not pin count, not filtered-kind count). When that number is zero, the entry is **disabled** (`UButton` disabled state + tooltip via `pins.map.emptyTooltip`). Selecting Map does not clear the `body_kind` selection, but the map ignores it — the grid/map switch lives on a different axis.

7. **Snapshot shape: `body.data.location = [lat, lon]` as a tuple.**
   Mirrors the `document.location` tuple shape (`[lat, lon]`) already used by `MapBase.vue` and `ViewModeMap.vue`. Using an object `{ lat, lon }` was considered but rejected to keep alignment with the document-level shape and to minimize transformation on either end. Validation mirrors the explorer: both entries must be finite numbers, latitude in [-90, 90], longitude in [-180, 180], and `[0, 0]` is treated as a non-geographic placeholder and excluded (consistent with `explorer-umap-bioregion`).

8. **Pin-creation call sites write the snapshot; no central helper required for v1.**
   Because the set of article-aware pin-creation sites is small and each already has the parent `document` in scope, each call site is updated to pass `location` when valid. Tempting to introduce a `buildPinBody(document, extras)` helper; deferred to avoid over-abstracting before we see the full shape in `pinboard-article-drawer`.

## Risks / Trade-offs

- **[Risk]** Two pins from the same article with different snapshotted locations → **Mitigation**: group deterministically on `source_document_uid`; take the first pin’s location. Document as a known edge case; virtually unreachable unless `document.location` is corrected between two pinning events.
- **[Risk]** A pin is created from an article-aware surface but `document.location` is missing/invalid → **Mitigation**: simply omit `body.data.location`; pin still works, just is not mapped. This is the same implicit behavior today for explorer map points.
- **[Risk]** Public board viewers (unauthenticated) rendering the map look like they could interact with pins → **Mitigation**: the popup is read-only display; no action buttons in v1. RLS already prevents mutations.
- **[Trade-off]** No backfill means the map starts empty for existing users → **Mitigation**: acceptable for a v1 ship; pinning behavior is ongoing enough that useful density appears quickly. A follow-up can add a backfill via a client-side pass or a server route.
- **[Trade-off]** Mapbox token is already shipped via runtime config; re-used here. No new secret surface, but keeps the pinboard dependent on the Mapbox SDK (bundle size impact is marginal — SDK is already in the explorer bundle).
- **[Risk]** Mapbox popup styling drift vs. `MapBase.vue` → **Mitigation**: share a small CSS module or Tailwind class set between the two popups; not strictly required for correctness.
- **[Risk]** Public shared board (`/explorer/board/public/[id]`) is broken for reasons unrelated to this change → **Mitigation**: because `PinBoardView` is shared between the private and public board pages, the Map view automatically lights up for the public board the moment that page itself is restored. No code inside this change needs to change for public-board parity; only the manual verification step for public-board read-only mode is deferred to the change that fixes the public board.

## Migration Plan

Not applicable. Pure frontend change, no DB migration, no breaking API. Deployment is a standard release. Feature is available immediately for every authenticated board and every public board after clients receive the bundle. Existing pins remain unaffected.

## Open Questions

- Should the popup also show the per-pin `user_note` in full or only as a short excerpt? Current lean: short excerpt (first ~120 chars) with ellipsis, consistent with how the card truncates long notes visually. Finalize when building the popup template.
- Should the Map view respect any future URL query param (e.g. `?view=map`) so a board can be shared pre-switched to Map? Out of scope for v1; reconsider with the drawer change that may introduce deep-linkable pin/article state.
