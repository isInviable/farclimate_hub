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

