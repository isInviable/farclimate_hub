# human-pins-frontend Specification

## Purpose

Authenticated UI to view and manage each project’s single pinboard and pins via Supabase `human` schema (`.schema('human')`). UI groups sections without backend section rows; respects logical document links and degraded **source missing** state. **Replaces** the legacy mock (`usePinsStore` in-memory Pinia + non-functional `saveCurrentProjectPins`).

## Requirements

### Requirement: Mock pin store is removed
The application SHALL NOT use `apps/web/app/stores/pins.ts` (or an equivalent in-memory-only pin list) as the source of truth for pins. The `useProjectsStore.saveCurrentProjectPins` stub and all related call sites SHALL be removed once Supabase pins are wired. Explorer and board UIs SHALL consume `human.pins` (or show empty/disabled state) instead of `pinnedItems` length from Pinia mock.

#### Scenario: No duplicate pin state
- **WHEN** a user views or edits pins for a project
- **THEN** data SHALL come from `human.pinboards` / `human.pins` only, not from a parallel mock store

### Requirement: Pin UI is available only to authenticated owners
The frontend SHALL expose pinboard and pin management only when the user is authenticated. Demo or `anon` users SHALL NOT receive successful reads or writes to `human.pinboards` or `human.pins`.

#### Scenario: Signed-in user with a project can open pins for that project
- **WHEN** an authenticated user has selected a project they own
- **THEN** the app SHALL load that project’s pinboard and pins from Supabase using `client.schema('human')` for `pinboards` and `pins`

#### Scenario: Demo user sees no database-backed pins
- **WHEN** the user is not signed in
- **THEN** the app SHALL NOT query `human.pinboards` / `human.pins` and SHALL show sign-in guidance or hide pin features

### Requirement: Pinboard is loaded 1:1 with the current project
The frontend SHALL treat each `human.projects` row as having exactly one `human.pinboards` row (created by the backend trigger). The app SHALL fetch the pinboard by `project_id` and list pins for that `pinboard_id`.

#### Scenario: Switching project switches pinboard
- **WHEN** the user changes the active project
- **THEN** the app SHALL load the pinboard and pins for the new `project_id` only

### Requirement: Pins are listed with stable ordering and UI-only sections
The frontend SHALL query pins ordered primarily by `sort_order` (ascending) with a deterministic tie-breaker (e.g. `created_at` or `id`). The UI MAY group rows into **sections** derived from `body_kind` or from a small mapping `body_kind` → section label, without persisting sections on the server in v1.

#### Scenario: Ordered list matches database intent
- **WHEN** pins are displayed
- **THEN** their order SHALL respect `sort_order` from `human.pins`

### Requirement: Pin body and note render per body_kind
The frontend SHALL render `body.data` according to `body_kind` using an application registry (extensible list). It SHALL display `user_note` when non-empty (same card or detail as the pin). Unknown `body_kind` values SHALL show a safe fallback (e.g. JSON snippet or generic card) without breaking the list.

#### Scenario: Known kind renders structured content
- **WHEN** `body_kind` matches a registered renderer (e.g. text segment, link, contact)
- **THEN** the UI SHALL show the appropriate layout using `body.v === 1` envelope

### Requirement: Chat pins render static thread
For `body_kind` representing a saved chat, the UI SHALL render `body.data.messages` with a clear **sender** distinction per message (e.g. role / user / assistant labels). Real-time updates or live sync SHALL NOT be required in v1.

#### Scenario: Chat pin shows who said what
- **WHEN** a pin has `body_kind` for chat and `data.messages` is a non-empty array
- **THEN** each message SHALL show content and identifiable sender side/label

### Requirement: Logical document reference and missing source
When `source_document_uid` is set, the app SHALL attempt to resolve the current knowledge document (e.g. via existing search or document APIs). If resolution fails, the UI SHALL still show `source_title_snapshot` and pin `body`, SHALL show a clear **source missing** (or equivalent i18n) badge, and SHALL disable or omit deep links to the document; viewing pin body and `user_note` SHALL remain possible. Clients SHALL set `source_document_uid` whenever the pinned content originates from a surface that knows its parent knowledge document (e.g. article views); omitting `source_document_uid` in such cases is a client-side defect, not an acceptable fallback.

#### Scenario: Resolved document offers navigation
- **WHEN** `source_document_uid` resolves to a live document
- **THEN** the user SHALL be able to open the explorer or article view from the pin

#### Scenario: Unresolved document does not break the pin
- **WHEN** `source_document_uid` does not resolve
- **THEN** the pin content and note remain visible and the UI SHALL indicate that the source is unavailable

#### Scenario: Article-hosted pin never omits source_document_uid
- **WHEN** a pin is created from any UI block inside an article view whose document `document_uid` is known
- **THEN** the insert payload to `human.pins` SHALL include that `document_uid` as `source_document_uid`

### Requirement: Pins created from an article view propagate source document context

When a pin is created from a UI surface rendering a known knowledge document (e.g. `ArticleViewAI` and its child views such as `ArticleSummaryView`), the client SHALL populate both `source_document_uid` (from the parent document) and `source_title_snapshot` (composed from the article title and, when available, the block/section label) on the inserted `human.pins` row. The "source missing" degraded UI SHALL only be shown for pins created outside of a known-document context.

#### Scenario: Pinning a sub-block of an article links to the parent document

- **WHEN** an authenticated user pins any sub-block (e.g. sector, hazards, contact, website, short description) from within `ArticleViewAI` for an article whose `document_uid` is known
- **THEN** the created `human.pins` row SHALL have `source_document_uid` equal to that document's `document_uid` and `source_title_snapshot` SHALL include the article title

#### Scenario: Board shows "Open in explorer" for block pins from articles

- **WHEN** the pinboard page (`/explorer/board`) renders a pin created via the article block flow
- **THEN** the card SHALL show the "Open in explorer" deep link (not the "source missing" warning) and clicking it SHALL navigate to the explorer with that `document` query parameter

#### Scenario: Block pin badge reflects block semantics

- **WHEN** a user pins a `contact` block or a `website` block from an article view
- **THEN** the persisted `body_kind` SHALL be `contact` or `website` respectively, and the board SHALL render the corresponding localized label from `pins.kinds.*`

#### Scenario: Pins without a host article keep degraded state

- **WHEN** a `SelectableBlock` (or other pin entry point) is rendered outside of a view that provides article context and the user pins it
- **THEN** the created pin MAY have `source_document_uid = null` and the board SHALL continue to display the existing "source missing" message for that pin

### Requirement: Article summary image gallery pins use per-image targets

When the application renders an **image gallery** in `ArticleSummaryView` (or successor) under `ArticleViewAI`, each **individual image** in that gallery SHALL be a distinct pin entry point. Pinning from that entry point SHALL create a pin with `body_kind` appropriate for image content (image pin semantics) and `body.data` SHALL include that image’s `src` and `alt` as captured from the pinned image element. The client SHALL apply the same `source_document_uid` and `source_title_snapshot` rules as for other article-hosted blocks when article context is available.

#### Scenario: Distinct pins for two images from the same article

- **WHEN** an authenticated user pins the first image in the gallery and later pins the second image
- **THEN** the application SHALL create two separate `human.pins` rows with distinct image `body.data` and both SHALL include the same `source_document_uid` when the parent article’s `document_uid` is known

#### Scenario: Gallery image pin is not the whole short-description block

- **WHEN** the user pins from an image-specific control in the gallery
- **THEN** the pinned DOM scope SHALL be the image (or image block) for that thumbnail, not the entire short-description `SelectableBlock` that contains narrative text

### Requirement: Authenticated CRUD and reorder for pins
The authenticated owner SHALL create, update, and delete pins through the Supabase client on `human.pins`, subject to RLS. The owner SHALL update `sort_order` to reorder pins, using drag-and-drop or explicit controls (implementation detail). Inserts SHALL send a valid `body` envelope with `v: 1` and `data` object.

#### Scenario: User creates a pin on own pinboard
- **WHEN** the user saves a new pin on their project’s pinboard
- **THEN** the app SHALL insert into `human.pins` with `pinboard_id` for that project’s board and valid `body_kind` / `body`

#### Scenario: User deletes a pin
- **WHEN** the user deletes a pin
- **THEN** the app SHALL delete the row and refresh the list

#### Scenario: User reorders pins
- **WHEN** the user changes order in the UI
- **THEN** the app SHALL persist new `sort_order` values so subsequent loads match

### Requirement: Image pins prefer server-orchestrated storage
For `body_kind` indicating an image, the product SHALL target a flow where a **server route** (or privileged worker) copies from platform/knowledge storage into `human-pin-images`, then the client writes/updates the pin with `body.data` pointing at bucket/path, as documented in `human-pin-storage`. An MVP MAY omit image UI until that route exists; the spec and README/design SHALL still describe the intended secure flow (not long-term reliance on client-only copy from arbitrary URLs).

#### Scenario: Spec documents secure image path
- **WHEN** engineers implement or review image pins
- **THEN** they SHALL have a documented server-side copy integration point aligned with Storage RLS

### Requirement: Internationalization for pin UX
User-visible strings for empty pinboard, errors, **source missing**, and section labels derived from `body_kind` (or i18n keys) SHALL use the app i18n system (e.g. `en` / `es`).

#### Scenario: Source missing is translated
- **WHEN** the UI shows the unresolved-source state
- **THEN** the string SHALL come from locale files, not hard-coded English only

### Requirement: Pin board cards expose an overflow menu and layout for selection

The pinboard grid cards (`PinBoardCard` or successor) SHALL show a **three-dot overflow** control when the card is used on the authenticated project pinboard. The control SHALL open a Nuxt UI dropdown (`UDropdownMenu` or equivalent documented pattern) with at least **Edit note** and **Remove** entries. When multi-select is enabled for the board, the existing **selection** control (plus / check icon) SHALL appear on **hover** at the **bottom-right** of the card; the overflow control SHALL remain at the **top-right**, with layering such that both controls remain usable and do not occupy the same corner.

#### Scenario: User opens the card menu

- **WHEN** the user activates the overflow control on a pin card
- **THEN** the UI SHALL present a dropdown with **Edit note** and **Remove** actions

#### Scenario: Selection affordance position when selection is enabled

- **WHEN** `enableSelection` is true and the user hovers the card
- **THEN** the plus/check selection control SHALL be shown at the bottom-right of the card and the overflow control SHALL remain at the top-right

### Requirement: Removing a pin from the board requires confirmation

The application SHALL NOT delete a pin from the pinboard in response to a single unprefaced click. Choosing **Remove** from the card menu SHALL open a confirmation dialog (Nuxt UI modal with explicit confirm and cancel). Only after the user confirms SHALL the client call delete on `human.pins` for that pin id (via the existing authenticated client path). Cancel SHALL leave the pin unchanged.

#### Scenario: User cancels delete

- **WHEN** the user opens remove confirmation and chooses cancel (or dismisses without confirming)
- **THEN** the pin row SHALL remain and no delete request SHALL be sent

#### Scenario: User confirms delete

- **WHEN** the user confirms removal in the dialog
- **THEN** the app SHALL delete the pin for the authenticated owner and the card SHALL disappear from the board list without a full page reload (same refresh behavior as existing `deletePin` implementation)

### Requirement: Edit note from the pin board card

Choosing **Edit note** from the overflow menu SHALL open a dialog or panel where the user can view and edit `user_note`. Saving SHALL persist `user_note` through the existing update path on `human.pins` for that pin id. Empty note SHALL be stored as null or empty per existing `updatePin` conventions. Strings SHALL use the application i18n system.

#### Scenario: User saves an updated note

- **WHEN** the user edits the note and confirms save
- **THEN** the updated text SHALL appear on the card (or empty state if cleared) after persistence succeeds

### Requirement: Pinboard exposes a global map view

The pinboard (`PinBoardView` or successor, as used on both `/explorer/board` and `/explorer/board/public/[id]`) SHALL expose a **Map** entry in its sidebar, visually separated from the `body_kind` section list. Selecting Map SHALL swap the main area from the pin grid to a map rendering. Selecting any `body_kind` section (including **All**) SHALL swap the main area back to the grid. The Map view SHALL be available to authenticated owners and to read-only viewers of public shared boards.

#### Scenario: User switches to the map view

- **WHEN** a user on the pinboard selects the Map entry in the sidebar
- **THEN** the main area SHALL render a Mapbox map in place of the pin grid, and the Map entry SHALL show a selected state

#### Scenario: User switches back to a kind section

- **WHEN** the user selects any section in the body-kind list (e.g. **All**, **Image**, **Contact**)
- **THEN** the main area SHALL render the pin grid for that kind and the Map entry SHALL return to its unselected state

#### Scenario: Public shared board exposes the map

- **WHEN** an unauthenticated viewer opens a public shared pinboard
- **THEN** the Map entry SHALL be present and functional in read-only mode

### Requirement: Map view renders one marker per unique source document

When the pinboard is showing the Map view, the application SHALL render **one marker per unique `source_document_uid`** for which at least one pin in the list carries a valid `body.data.location`. The application SHALL NOT render a separate marker per pin; fragments of the same article SHALL be aggregated into that article’s single marker.

#### Scenario: Multiple fragments from one article show a single marker

- **WHEN** the user has three pins sharing the same `source_document_uid` (for example an article pin, an image pin, and a text-segment pin) and that article has a valid `body.data.location`
- **THEN** the Map SHALL show exactly one marker at that location

#### Scenario: Pins from different articles show distinct markers

- **WHEN** the user has pins from multiple articles, each with a distinct `source_document_uid` and each with a valid `body.data.location`
- **THEN** the Map SHALL show one marker per article

### Requirement: Pin creation snapshots parent document location

When a pin is created from a UI surface that has the parent knowledge document in scope (for example `ArticleViewAI.vue`, `ArticleSummaryView.vue`, the article image gallery / lightbox flow, or any `SelectableBlock` rendered inside an article view), the client SHALL include the parent document’s geographic location in `body.data.location` as a `[latitude, longitude]` tuple. The client SHALL include this snapshot only when the parent document’s `location` is a pair of finite numbers with latitude in `[-90, 90]`, longitude in `[-180, 180]`, and SHALL exclude the non-geographic placeholder `[0, 0]`. When the parent document has no valid location, the client SHALL omit `body.data.location` and the pin SHALL be created without it.

#### Scenario: Article-hosted pin snapshots location

- **WHEN** an authenticated user pins any block, image, or the article itself from a view rendering an article whose `document.location` is a valid pair
- **THEN** the created `human.pins` row’s `body.data.location` SHALL equal that document’s `location` tuple

#### Scenario: Article without coordinates does not snapshot

- **WHEN** the parent article’s `document.location` is missing, non-numeric, or `[0, 0]`
- **THEN** the created pin SHALL NOT include a `body.data.location` field

### Requirement: Map view derives markers from the pin list only

The Map view SHALL derive its markers from the already-loaded pin list by grouping on `source_document_uid`. It SHALL NOT fetch additional document records, call new server routes, or depend on any data outside the existing pin loading path. The application SHALL pick the marker’s coordinates from the first pin in each group that carries a valid `body.data.location`, and SHALL pick the marker’s display title from that group’s `source_title_snapshot`.

#### Scenario: No extra network requests for the map

- **WHEN** the user switches to the Map view after pins have loaded
- **THEN** the Map SHALL render using only data already present on `human.pins` rows, without triggering document or search API requests

### Requirement: Map marker popup shows article context and pinned fragments

When the user activates a marker (click or equivalent keyboard affordance), the application SHALL open a popup anchored to the marker that shows the article’s display title and a list of the user’s pins belonging to that article. Each listed pin SHALL show its localized `body_kind` label (via `pins.kinds.*`), and, when `user_note` is non-empty, a short excerpt of the note. The popup SHALL NOT expose navigation controls in this capability (no "Open in explorer", no drawer trigger); those belong to separate capabilities and MAY be added additively later.

#### Scenario: Popup for an article with one pin

- **WHEN** the user activates a marker representing an article with one pin
- **THEN** the popup SHALL show the article title and a single-row list containing that pin’s kind label (and note excerpt if non-empty)

#### Scenario: Popup for an article with multiple pins

- **WHEN** the user activates a marker representing an article with several pins
- **THEN** the popup SHALL show the article title and a row per pin, each displaying the pin’s kind label and, if present, a note excerpt

### Requirement: Body-kind filter does not affect the map

The Map view SHALL always render the complete set of pins-with-location regardless of which `body_kind` section is currently selected in the sidebar. Selecting a kind (e.g. **Image**) SHALL have no effect on which markers appear on the map.

#### Scenario: Kind selection leaves map unchanged

- **WHEN** the user has selected a specific `body_kind` section (for example **Image**) and then switches to the Map view
- **THEN** the Map SHALL render every pinned article with a valid location, not only those whose pins match the selected kind

### Requirement: Map sidebar entry count and empty state

The Map entry in the sidebar SHALL display a count equal to the number of **unique articles with a valid `body.data.location`** among the loaded pins (not the total number of pins, not the count filtered by `body_kind`). When that count is zero, the Map entry SHALL render in a disabled state with a tooltip from the application i18n system explaining that no pins with a location are available; selecting the disabled entry SHALL NOT swap the main area.

#### Scenario: Count reflects unique articles

- **WHEN** the user has five pins across three distinct articles, each with valid locations
- **THEN** the Map entry SHALL show a count of `3`

#### Scenario: Disabled when no pins have a location

- **WHEN** no loaded pin carries a valid `body.data.location`
- **THEN** the Map entry SHALL render disabled with a tooltip and remain non-selectable

### Requirement: Existing pins without a snapshot are not mapped

The application SHALL NOT perform backfill of `body.data.location` for pins created before this capability is in effect. Such pins SHALL remain unchanged in the database and SHALL NOT appear on the Map view. They SHALL continue to render correctly in the grid view.

#### Scenario: Legacy pins stay in the grid only

- **WHEN** a user has pins created before this capability shipped and none of them carries `body.data.location`
- **THEN** the Map entry SHALL show a count of `0` (disabled) and the grid view SHALL continue to display those pins normally

### Requirement: Pinboard provides an in-page article side panel

The pinboard (`PinBoardView` or successor, as used on both `/explorer/board` and `/explorer/board/public/[id]`) SHALL provide an in-page side-panel article reader powered by the existing `ArticleSidePanel` component. Opening the panel SHALL NOT navigate away from the pinboard; closing the panel SHALL leave the pinboard state unchanged (same view, same selected kind, same map/grid choice).

#### Scenario: Opening preserves pinboard state

- **WHEN** the user opens the article drawer on the pinboard with any view selected (grid or map)
- **THEN** the drawer SHALL appear as a side slideover without replacing the pinboard’s main area, and the pinboard view/section selection SHALL be preserved while the drawer is open

#### Scenario: Drawer is available on the public shared board

- **WHEN** an unauthenticated viewer opens the article drawer on a public shared pinboard
- **THEN** the drawer SHALL render the article in read-only mode without requiring authentication

### Requirement: Drawer opens from map markers

When a user activates the **Open article** button in the Map view’s marker popup (introduced by `pinboard-global-map`), the application SHALL open the article drawer for that marker’s `source_document_uid` and SHALL provide the marker’s grouped pins as the panel’s pins context.

#### Scenario: Open article from map popup

- **WHEN** a user clicks the **Open article** button in a map marker popup
- **THEN** the drawer SHALL open with the corresponding article loaded and SHALL show the user’s pins for that article alongside the article content

### Requirement: Drawer opens from pin card clicks

Clicking the body of a `PinBoardCard` on the grid SHALL open the article drawer for that pin’s `source_document_uid` and SHALL pass all sibling pins (pins sharing the same `source_document_uid`) as the panel’s pins context. Clicks on the card’s overflow menu button and on the selection toggle SHALL NOT open the drawer. When `source_document_uid` is missing, the card body click SHALL be inert and the drawer SHALL NOT open.

#### Scenario: Card click opens the drawer

- **WHEN** the user clicks the body of a pin card whose `source_document_uid` is set
- **THEN** the drawer SHALL open with that article and the pins list SHALL include every pin in the board sharing that `source_document_uid`

#### Scenario: Card click does not open during overflow menu interaction

- **WHEN** the user clicks the overflow menu trigger or the selection toggle on a card
- **THEN** the drawer SHALL NOT open

#### Scenario: Degraded pins do not open the drawer

- **WHEN** the user clicks the body of a card whose pin has no `source_document_uid`
- **THEN** the drawer SHALL NOT open and the card’s existing "source missing" UI SHALL remain as the only indication of state

### Requirement: Drawer accepts a document or a document_uid

The article side panel SHALL accept either a preloaded `ArticleDetail` or a `document_uid`. When given a `document_uid`, the panel SHALL resolve the article through the existing `document-by-uid` server route and SHALL render a loading state until the response is available. On resolution failure, the panel SHALL render a friendly, i18n-backed error message in its body without closing the drawer. Callers MAY supply a `titleFallback` string (for example a pin’s `source_title_snapshot`) to display in the header while the article loads.

#### Scenario: Drawer opens with a preloaded document

- **WHEN** a caller supplies a fully-loaded `ArticleDetail`
- **THEN** the drawer SHALL render the article immediately without triggering a fetch

#### Scenario: Drawer opens with a uid and resolves the document

- **WHEN** a caller supplies only a `document_uid`
- **THEN** the drawer SHALL render a loading state, fetch the article via the existing server route, and display the article once available

#### Scenario: Resolution failure shows an error

- **WHEN** the server route fails or returns no document for the supplied uid
- **THEN** the drawer SHALL display a localized error message in the panel body and SHALL remain open until the user closes it

### Requirement: Drawer renders an optional pins-in-article section

When the caller passes a non-empty list of `HumanPinRow` belonging to the opened article, the side panel SHALL render a dedicated section inside its body showing those pins with their localized kind labels and, when non-empty, their `user_note`. When the caller passes no pins (for example the explorer usage), the panel SHALL NOT render the section.

#### Scenario: Pins section appears when pins are provided

- **WHEN** the drawer opens with a non-empty pins list
- **THEN** the body SHALL include a clearly labeled section listing those pins

#### Scenario: Pins section is absent when pins are not provided

- **WHEN** the drawer opens without a pins list (existing explorer usage)
- **THEN** the body SHALL NOT render any pins section and behavior SHALL match the current explorer experience

