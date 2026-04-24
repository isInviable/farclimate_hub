## ADDED Requirements

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
