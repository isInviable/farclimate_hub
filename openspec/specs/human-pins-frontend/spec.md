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
- **WHEN** `body_kind` matches a registered renderer (e.g. text segment, link, contact, mind map)
- **THEN** the UI SHALL show the appropriate layout using `body.v === 1` envelope

#### Scenario: Mind map kind renders structured preview
- **WHEN** `body_kind` is the mind-map dedicated value and `body.data.markdown` is a non-empty string
- **THEN** the UI SHALL render a mind-map preview or embedded viewer using that markdown (and optional `yaml`) without executing untrusted scripts beyond the existing markmap stack

### Requirement: Chat pins render static thread
For `body_kind` representing a saved chat, the UI SHALL render `body.data.messages` with a clear **sender** distinction per message (e.g. role / user / assistant labels). Real-time updates or live sync SHALL NOT be required in v1.

#### Scenario: Chat pin shows who said what
- **WHEN** a pin has `body_kind` for chat and `data.messages` is a non-empty array
- **THEN** each message SHALL show content and identifiable sender side/label

### Requirement: Full-thread chat pins may include citations metadata

When `body_kind` is `chat` and `body.data.citationsByMessageId` is a non-empty object, the pinboard chat renderer SHOULD display citation titles under the matching assistant messages when rendering the saved thread, using the stored `title` and `documentUid` fields. Opening a stored citation SHOULD use the same `open-article` / explorer deep-link behavior as live corpus chat when `documentUid` is present.

Real-time sync or editing of saved threads is not required.

#### Scenario: Saved thread pin shows citations under assistant message

- **WHEN** a pin has `body_kind` `chat`, `data.messages` includes an assistant message with id `m1`, and `data.citationsByMessageId.m1` lists one citation with a title
- **THEN** the pin detail view SHALL show that title associated with the assistant message for `m1`

#### Scenario: Thread pin without citations metadata

- **WHEN** a `chat` pin has `messages` but no `citationsByMessageId`
- **THEN** the pin SHALL render messages only without citation rows

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

### Requirement: Capturable blocks replace cosmetic block selection

Article capture surfaces SHALL use an explicit capture action instead of click-to-select behavior. A capturable block wrapper MAY wrap arbitrary rendered content through its default slot, SHALL render a default pin/capture control when capture is enabled, and SHALL allow callers to replace that control through a named slot or equivalent component API.

#### Scenario: Block click does not toggle selection

- **WHEN** a user clicks the body of a capturable article block
- **THEN** the application SHALL NOT toggle a local selected ring or selected state unless that click activates a real product action

#### Scenario: Default capture control is available

- **WHEN** a capturable block is rendered with capture enabled and no custom pin slot
- **THEN** the block SHALL expose a visible or discoverable capture control that opens the pin capture flow

#### Scenario: Custom capture control is supported

- **WHEN** a consumer provides a custom pin slot/control for a capturable block
- **THEN** the custom control SHALL receive the information needed to open the capture flow and reflect saving or pinned state

### Requirement: Captures use explicit structured payloads

The pin creation flow for supported article-hosted captures SHALL persist explicit structured payloads in `human.pins.body.data` rather than deriving primary content from rendered DOM text. Each capture request SHALL include a `body_kind`, title or label, and payload appropriate to the captured content. DOM-derived text MAY be used only as a fallback for generic or legacy capture surfaces.

#### Scenario: Recipe section capture stores section metadata

- **WHEN** a user captures a recipe section from the structured article view
- **THEN** the created pin SHALL include a `body_kind` identifying the section-like content and `body.data` SHALL include the section key and markdown/content used to render that section

#### Scenario: Image capture stores image metadata

- **WHEN** a user captures an image from an article capture surface
- **THEN** the created pin SHALL include image-specific `body.data` such as source URL or storage pointer metadata and alt/title metadata when available

#### Scenario: AI-generated content capture stores generated content explicitly

- **WHEN** a user captures an AI-generated summary or chatbot response from a supported article surface
- **THEN** the created pin SHALL store the generated text or message payload explicitly in `body.data`, along with a kind or metadata that distinguishes it from ordinary article text

### Requirement: Pin creation accepts an optional user note

The article capture flow SHALL let the user add an optional note before saving a new pin. The note SHALL be persisted to `human.pins.user_note` during the create operation. Empty notes SHALL be persisted consistently with existing update-note conventions.

#### Scenario: User saves a capture with a note

- **WHEN** a user opens the capture flow, enters a note, and confirms save
- **THEN** the created pin SHALL include the note in `user_note` and the board SHALL render that note wherever pin notes are displayed

#### Scenario: User saves a capture without a note

- **WHEN** a user confirms a capture without entering a note
- **THEN** the created pin SHALL still be created and `user_note` SHALL be empty or null per existing pin update conventions

#### Scenario: User cancels capture

- **WHEN** a user opens the capture flow and cancels before confirming
- **THEN** no `human.pins` insert SHALL be sent

### Requirement: Article text selection can be captured

Supported article reading surfaces SHALL allow users to select non-empty text inside the article container and open the same note-capable pin capture flow for that selected quote. Selected text captures SHALL preserve the parent article source context when available.

#### Scenario: User captures selected article text

- **WHEN** a user selects text inside a supported article reading container and activates the selected-text capture action
- **THEN** the created pin SHALL include the selected quote in `body.data` and SHALL include the parent article `source_document_uid` when the article context is known

#### Scenario: Selection outside the article is ignored

- **WHEN** a user selects text outside the supported article reading container
- **THEN** the article selected-text capture action SHALL NOT create a pin for that selection

#### Scenario: Empty selection is ignored

- **WHEN** the current selection is empty or whitespace-only
- **THEN** the selected-text capture action SHALL remain hidden or disabled and no pin SHALL be created

### Requirement: Article-hosted captures preserve source context

All captures created from article-hosted surfaces, including capturable blocks and selected text, SHALL populate `source_document_uid`, `source_title_snapshot`, and valid `body.data.location` using the same parent article context rules as existing article block pins.

#### Scenario: Capturable block preserves article source

- **WHEN** a user captures a block inside an article view whose `document_uid` is known
- **THEN** the created pin SHALL include that `document_uid` as `source_document_uid` and a `source_title_snapshot` that includes the article title and captured block label when available

#### Scenario: Selected text preserves article source

- **WHEN** a user captures selected text inside an article view whose `document_uid` is known
- **THEN** the created pin SHALL include that `document_uid` as `source_document_uid` and a `source_title_snapshot` that identifies the article and selected-text capture

#### Scenario: Valid article location is snapshotted

- **WHEN** a user creates any article-hosted capture and the parent article has a valid non-placeholder `[latitude, longitude]` location
- **THEN** the created pin SHALL include that tuple in `body.data.location`

### Requirement: New capture body kinds render safely

The pinboard frontend SHALL render body kinds introduced by this capture flow through explicit render mappings when available and through the existing safe fallback when unavailable. Unknown body kinds SHALL NOT break the pin list, board card menu, note rendering, source navigation, or map grouping behavior.

#### Scenario: Known new body kind renders with appropriate preview

- **WHEN** the board displays a pin created from selected text, a recipe section, an AI summary, a chat response, a grid compare summary, or a mind map and a renderer exists for that `body_kind`
- **THEN** the card SHALL show an appropriate preview using `body.data` and SHALL still show `user_note` when non-empty

#### Scenario: Unknown new body kind falls back safely

- **WHEN** the board displays a pin whose `body_kind` has no specific renderer
- **THEN** the card SHALL render a safe generic preview and keep board interactions usable

### Requirement: Mind map pins use a dedicated body_kind

The application SHALL support a dedicated `body_kind` for pins created from the Explorer mind map modal (e.g. `markmap`) that is distinct from `ai_summary`, `recipe_section`, and `grid_compare_summary`. Persisted `body.data` SHALL include at least the markdown string used to build the map (`markdown`). The client MAY also persist an optional `yaml` string when the front matter differs from the viewer default. The pinboard SHALL render this kind through an explicit renderer that can reconstruct the map from `body.data`.

#### Scenario: Create pin from mind map modal

- **WHEN** an authenticated user confirms saving the mind map from the Explorer mind map modal
- **THEN** the insert SHALL set `body_kind` to the mind-map dedicated value and `body.data` SHALL include the `markdown` field (and `yaml` when applicable) sufficient for `MarkmapViewer` to render the same structure

#### Scenario: Board lists mind map pin

- **WHEN** the pinboard shows a pin with the mind-map `body_kind`
- **THEN** the card SHALL render the pin body without error, SHALL show the appropriate localized kind label alongside other `body_kind` labels in that view, and SHALL show `user_note` when non-empty

#### Scenario: Mind map pin with known explorer document links like other article-linked pins

- **WHEN** a mind map pin is created while the Explorer has a resolvable parent knowledge `document_uid` for the active context
- **THEN** the created row SHALL include that `document_uid` as `source_document_uid` and a `source_title_snapshot` that identifies the article and mind-map capture where product copy requires it

### Requirement: Explorer mind map modal exposes pin capture for authenticated users

The Explorer mind map fullscreen modal SHALL expose a capture action for authenticated project owners that opens the same optional-note pin capture flow used elsewhere. The action SHALL be hidden or disabled for unauthenticated users. Canceling the flow SHALL NOT insert a pin.

#### Scenario: Authenticated user opens capture from mind map

- **WHEN** an authenticated user activates the mind map pin control
- **THEN** the application SHALL open the pin capture flow prefilled with the mind-map structured payload

#### Scenario: Unauthenticated user does not get the control

- **WHEN** the user is not signed in
- **THEN** the mind map modal SHALL NOT offer a successful path to insert `human.pins` rows

### Requirement: Grid compare summary pins use a dedicated body_kind

The application SHALL support a dedicated `body_kind` for pins created from the Explorer grid comparison view (e.g. `grid_compare_summary`) that is distinct from `ai_summary`, `chat_response`, and generic `text_segment`. The pinboard SHALL render this kind with the same text-oriented renderer as other markdown-capable pin bodies unless a specialized layout is introduced later, and the localized kind label (`pins.kinds.*`) SHALL be present when other kinds expose labels in the same UI.

#### Scenario: Create pin from grid cell

- **WHEN** an authenticated user saves a pin from a grid compare capturable with structured payload fields for that cell
- **THEN** the insert SHALL set `body_kind` to the grid-compare dedicated value and `body.data` SHALL include the captured summary content and mode metadata as defined in `explorer-viewmode-grid-compare`

#### Scenario: Board lists grid compare pin

- **WHEN** the pinboard shows a pin with the grid-compare `body_kind`
- **THEN** the card SHALL render the pin body without error and SHALL show the appropriate kind label alongside other `body_kind` labels in that view

### Requirement: Explorer grid compare provides source document when known

When pin creation is initiated from the Explorer grid comparison view and the search hit’s document provides `document_uid`, the client SHALL populate `source_document_uid` and `source_title_snapshot` on the new `human.pins` row. The `source_title_snapshot` SHOULD combine the document title with a short grid-specific descriptor (e.g. compare mode or property label) when such metadata improves recognition on the board.

#### Scenario: Grid pin links to Explorer

- **WHEN** a grid compare pin is created with a known `document_uid`
- **THEN** the pinboard SHALL offer the same “open in explorer” / document navigation behavior as other article-linked pins, subject to document resolution rules already defined for `human.pins` rows

### Requirement: Pinboard integrates saved searches from human.saved_searches

`PinBoardView` (or successor) SHALL fetch and display saved searches from `human.saved_searches` alongside `human.pins`, using dedicated UI (not `PinBoardCard` rows backed by `human.pins`). Sidebar counts for **All** MAY include saved searches plus pins per product copy. Legacy `human.pins` rows with `body_kind` `saved_search`, if any, MAY render through the generic fallback until removed.

#### Scenario: Saved searches sidebar category

- **WHEN** the pinboard loads for a project that has saved searches
- **THEN** the sidebar SHALL include a **Saved searches** category with a correct count and the grid SHALL support filtering to that category

### Requirement: Explorer floating action bar excludes saved-search UI

`ActionBarExplorer` SHALL NOT import or render `SavedSearchMenu` (or an equivalent saved-search-only picker). Saved search access remains on the filter sidebar and pinboard.

#### Scenario: Action bar template

- **WHEN** the explorer page renders `ActionBarExplorer`
- **THEN** its implementation SHALL not include saved-search menu components

### Requirement: Full-paper pins use dedicated body_kind document

The application SHALL persist pins that represent the **entire** catalog knowledge document with `body_kind` exactly `document`. Pins that represent excerpts, sections, selections, mind maps, AI blocks, recipe fragments, images, contacts, websites, chats, saved searches, or any other non-whole-document content SHALL NOT use `body_kind` `document`; they SHALL continue to use their existing kinds (including but not limited to `text_segment`, `selected_text`, `section`, `recipe_section`, `markmap`, `ai_summary`, `grid_compare_summary`, `chat_response`, `image`, `contact`, `website`, `saved_search`).

#### Scenario: Document pin is not a text_segment

- **WHEN** a user creates a pin intended to represent the whole document from an allowed write path in this change
- **THEN** the inserted `human.pins` row SHALL have `body_kind` `document` and SHALL NOT have `body_kind` `text_segment` solely for that intent

#### Scenario: Fragment pin remains a fragment kind

- **WHEN** a user pins a paragraph, selection, markmap, or other in-document block
- **THEN** the inserted row SHALL have a fragment-appropriate `body_kind` and SHALL NOT use `document`

### Requirement: Document pins require source_document_uid and user_note

For `body_kind` `document`, the client SHALL set `source_document_uid` to the catalog document's stable identifier. The client SHALL set `user_note` according to the same product rules as other pins that require a note on save (including empty string only if the product explicitly allows omitting validation for this kind). The `body` envelope SHALL remain `v: 1` with a `data` object; `data` MAY be empty or minimal if insert validation permits.

#### Scenario: Search-created document pin carries document uid

- **WHEN** a user pins a document from a search hit that includes `document_uid`
- **THEN** the new pin SHALL have `body_kind` `document` and `source_document_uid` equal to that uid

### Requirement: Search hit pinning uses pinCapture with document kind

Pin creation from the **search results** pin affordance SHALL use the explicit capture API (`pinCapture` / `buildPinCapturePayload` or successor) with `bodyKind` `document` and structured fields. That flow SHALL NOT rely on the legacy `pinContent` DOM capture path for the purpose of persisting the pin body kind.

#### Scenario: Search row pin does not use pinContent for body_kind

- **WHEN** the user activates the pin control on a search result row that represents a whole document
- **THEN** the application SHALL invoke the same capture pipeline used for explicit `pinCapture` requests with `bodyKind` `document`, not `pinContent`-driven segment capture for determining `body_kind`

### Requirement: Document preview and full article expose Pin document

The **document preview** layout and the **full article** layout each SHALL expose an explicit control (e.g. "Pin document" or equivalent localized label) that creates a pin with the same persisted shape as search-hit whole-document pinning (`body_kind` `document`, required fields above).

#### Scenario: Preview and article both create document pins

- **WHEN** an authenticated user uses Pin document from document preview and separately from full article for the same logical document
- **THEN** each action SHALL insert a `human.pins` row with `body_kind` `document` and the correct `source_document_uid` for that document (multiple rows allowed; no deduplication required)

### Requirement: Pin board list supports filtering full papers

The pin board sidebar list (e.g. `BoardList.vue` or successor) SHALL provide a user-visible **filter or category** that restricts the list to pins where `body_kind === "document"`. The all-pins view SHALL remain available. Labels SHALL come from the application i18n system.

#### Scenario: Filter shows only document pins

- **WHEN** the user selects the full-paper filter
- **THEN** every listed pin SHALL have `body_kind` `document` and pins with other kinds SHALL not appear in that filtered list

#### Scenario: Localized kind label for document pins

- **WHEN** the UI displays a localized label for `body_kind` `document` in the same contexts as other kinds (e.g. section header, card chrome)
- **THEN** the UI SHALL resolve a `pins.kinds.*` key for `document` from locale files

### Requirement: Document and fragment pins may coexist per document

The same `source_document_uid` MAY appear on a `document` pin and on one or more fragment pins simultaneously. The application SHALL NOT require deduplication between `document` and fragment pins.

#### Scenario: Document pin and excerpt pin both listed

- **WHEN** a user has pinned the full document and also pinned a paragraph from that document
- **THEN** both pins SHALL appear in the unfiltered pin list (subject to sort order) and the full-paper filter SHALL show only the `document` row

### Requirement: Renderer registry supports document kind

The pin body renderer registry used by the pinboard (e.g. `PinBoardCard` or successor) SHALL register `body_kind` `document` so cards do not fall through to the unknown-kind fallback. The card SHALL show `source_title_snapshot`, navigation to the document when resolvable, `user_note` when non-empty per existing rules, and standard overflow actions consistent with other document-linked pins.

#### Scenario: Document pin is not unknown kind

- **WHEN** a pin has `body_kind` `document` and valid envelope `body.v === 1`
- **THEN** the pinboard SHALL NOT treat it as an unknown `body_kind` for rendering purposes

### Requirement: Pinboard creates podcasts from selected pins

The pinboard action bar SHALL replace the dummy "Create podcast" behavior with a guided podcast creation wizard for the current selected pins. The wizard SHALL show selected items before generation, collect optional extra prompt instructions, collect a podcast title, call the existing podcast summary endpoint, allow the user to edit the returned script, and call the existing podcast text-to-speech endpoint to create a podcast artifact.

#### Scenario: User opens the podcast wizard

- **WHEN** an authenticated user has selected one or more pins on `/explorer/board` and chooses "Create podcast" from the board action bar
- **THEN** the application SHALL open a podcast creation wizard instead of the demo audio modal
- **AND** the first step SHALL list the selected pins that will be included

#### Scenario: Empty selection is blocked

- **WHEN** the user chooses "Create podcast" with no selected pins
- **THEN** the application SHALL prevent podcast generation and show an actionable validation message
- **AND** no podcast endpoint request SHALL be sent

#### Scenario: Selection exceeds frontend limits

- **WHEN** the selected pins exceed the configured selected-item limit or selected text-size limit
- **THEN** the wizard SHALL display a validation error that explains the exceeded limit
- **AND** the wizard SHALL keep the user on the review step without calling the summarize endpoint

#### Scenario: Summary generation returns editable script

- **WHEN** the user submits valid selected pins, extra instructions, and title from the wizard
- **THEN** the application SHALL call `POST /api/podcast-summarize` with structured selected source context and extra instructions
- **AND** the wizard SHALL show a loading state while the request is pending
- **AND** the returned script SHALL appear in an editable text area for user review

#### Scenario: Reviewed script creates podcast artifact

- **WHEN** the user clicks "Generate podcast" after reviewing the editable script
- **THEN** the application SHALL call `POST /api/podcast-text-to-speech` with the active project id, reviewed script, title, selected source pin ids, and relevant metadata
- **AND** the wizard SHALL tell the user that the audio will be available in the board Artifacts section after creation

### Requirement: Podcast wizard sends useful selected source context

The podcast wizard SHALL build selected source payloads from the loaded `human.pins` rows for the active board. Each selected source sent to the summarize endpoint MUST preserve source boundaries and include best-available pin context, including pin id, display title, body kind, source document uid, user note, and selected text or markdown extracted from the pin body.

#### Scenario: Selected pin context preserves source boundaries

- **WHEN** the user generates a summary from multiple selected pins
- **THEN** the summarize request SHALL include one source item per selected pin
- **AND** each source item SHALL include the pin id and available title, kind, source document uid, note, and text fields

#### Scenario: User instructions are passed to summarization

- **WHEN** the user enters extra podcast instructions in the wizard
- **THEN** the summarize request SHALL include those instructions as `extraInstructions`

### Requirement: Pinboard shows podcast artifacts

The board page SHALL include an Artifacts section with a Podcasts subsection. The Podcasts subsection SHALL be visible for authenticated users of the active project even when no podcast artifacts exist, and SHALL list available ready podcast artifacts with controls to listen and download when they are available.

#### Scenario: No podcasts available

- **WHEN** the authenticated user opens `/explorer/board` for a project with no podcast artifacts
- **THEN** the Artifacts section SHALL still show a Podcasts subsection
- **AND** the subsection SHALL display help text explaining that generated podcasts will appear there

#### Scenario: Podcasts are listed

- **WHEN** the active project has ready `human.artifacts` rows with `kind = 'podcast'`
- **THEN** the Podcasts subsection SHALL list those podcasts with their title or fallback label, creation metadata when available, and controls to listen and download

#### Scenario: Podcast list refreshes after generation

- **WHEN** the podcast text-to-speech endpoint returns a created podcast artifact
- **THEN** the board SHALL refresh or update the Podcasts subsection so the new artifact is available without requiring a full page reload

#### Scenario: Artifact access stays authenticated

- **WHEN** the user listens to or downloads a podcast artifact
- **THEN** the application SHALL use an authenticated private Storage access path for the artifact object
- **AND** it SHALL NOT rely on bundled demo media or public static podcast files

### Requirement: Pinboard artifacts include a Downloads section

The board Artifacts UI SHALL include a **Downloads** subsection (alongside existing subsections such as Podcasts) for `human.artifacts` rows with `kind = 'pinboard_export'`. The subsection SHALL list export artifacts for the active project with status, title or fallback label, created time when available, and actions to download when `status = 'ready'`.

#### Scenario: Downloads section is visible

- **WHEN** an authenticated user opens `/explorer/board` with an active owned project
- **THEN** the Artifacts area SHALL show a Downloads subsection even if no exports exist yet

#### Scenario: Ready exports offer download

- **WHEN** the project has a `ready` pinboard export artifact
- **THEN** the Downloads list SHALL offer download using authenticated Storage access (e.g. signed URL) consistent with other artifacts

#### Scenario: Pending exports show progress state

- **WHEN** a pinboard export artifact is `pending`
- **THEN** the UI SHALL show a non-ready state and SHALL poll or periodically refetch artifact list until the artifact becomes `ready` or `failed` or the user leaves the context

### Requirement: User can generate a new pinboard download

The Downloads subsection SHALL provide a control (e.g. button) **Generate new download** that calls the server export endpoint for the **whole** pinboard of the active project. The UI SHALL disable or guard the action when there is no project, when the user is not authenticated, or when a duplicate in-flight policy applies (implementation MAY allow parallel exports or throttle with clear feedback).

#### Scenario: Generate triggers export job

- **WHEN** the user activates Generate new download under valid conditions
- **THEN** the client SHALL call the pinboard export API for the current project
- **AND** a new `pending` artifact SHALL appear in the list without a full page reload

#### Scenario: Failed export is visible

- **WHEN** an export ends in `failed`
- **THEN** the Downloads list SHALL show failure state and an actionable message where possible
