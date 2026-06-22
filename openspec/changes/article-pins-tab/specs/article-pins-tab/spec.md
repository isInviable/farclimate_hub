# article-pins-tab (change spec)

Requirements for presenting per-article pins as a conditional primary tab inside `ArticleViewAI`.

---

## ADDED Requirements

### Requirement: Article view exposes a conditional Your pins primary tab

The article view component (`ArticleViewAI` or successor) SHALL expose a fourth primary section labeled **Your pins** (i18n key `tabs.pins`), positioned after **Contact and references** in the primary navigation order `[Recipe, Chat, Contact and references, Your pins]`.

The **Your pins** tab SHALL appear in the primary navigation only when the resolved pin list for the opened article contains at least one `HumanPinRow`. When the list is empty, the tab SHALL NOT be rendered and users SHALL NOT see an empty pins tab.

#### Scenario: Tab visible when article has pins

- **WHEN** the article view is mounted for a document with one or more resolved pins for that document's `source_document_uid`
- **THEN** the primary navigation SHALL include a **Your pins** tab after Contact and references

#### Scenario: Tab hidden when article has no pins

- **WHEN** the article view is mounted and the resolved pin list for the document is empty
- **THEN** the primary navigation SHALL NOT include a **Your pins** tab

#### Scenario: Tab disappears when last pin is removed

- **WHEN** the user is viewing the **Your pins** tab and the resolved pin list becomes empty (for example after a delete performed elsewhere)
- **THEN** the application SHALL navigate away from the pins tab to Recipe (or another safe default primary tab) and SHALL remove the **Your pins** tab from the navigation

### Requirement: Your pins tab shows a persistent count badge

When the **Your pins** tab is rendered, the primary navigation SHALL display a red numeric badge showing the count of resolved pins. The badge SHALL remain visible when the **Your pins** tab is the active tab.

#### Scenario: Badge shows pin count

- **WHEN** the article has three resolved pins and the **Your pins** tab is visible
- **THEN** the tab label SHALL display a red badge with the number `3`

#### Scenario: Badge visible on active tab

- **WHEN** the user selects the **Your pins** primary tab
- **THEN** the red count badge SHALL still be visible on that tab

### Requirement: Your pins tab renders a dedicated scrollable panel

Selecting the **Your pins** primary tab SHALL show a dedicated tab panel that scrolls vertically when content overflows, consistent with the Contact and references tab panel. The panel SHALL NOT render pins below other primary tab content or in a footer outside the tab system.

#### Scenario: Pins panel replaces other tab content

- **WHEN** the user activates the **Your pins** tab
- **THEN** only the pins panel content SHALL be visible in the main content area and recipe/chat/contacts content SHALL be hidden

### Requirement: Pins panel uses ArticlePinsSection with full body rendering

The pins tab panel SHALL render pins through a dedicated `ArticlePinsSection` component (or successor). For each pin, the section SHALL show:

1. A localized label for `body_kind` (via existing `pins.kinds.*` i18n keys).
2. The pin body using the same `PinBodyRenderer` component used on the pin board grid.
3. The `user_note` when non-empty, with appropriate i18n labeling.

The section SHALL NOT repeat `source_title_snapshot` as a per-pin heading when all pins belong to the same opened article.

#### Scenario: Pin body renders with PinBodyRenderer

- **WHEN** a pin has `body_kind` `recipe_section` and markdown in `body.data`
- **THEN** the pins panel SHALL render the markdown through `PinBodyRenderer` in the same manner as the pin board card

#### Scenario: User note displayed when present

- **WHEN** a pin has a non-empty `user_note`
- **THEN** the pins panel SHALL display that note below the rendered pin body

### Requirement: Article pins resolve from prop or shared store

`ArticleViewAI` SHALL accept an optional `pins?: HumanPinRow[]` prop. When provided and non-empty, the component SHALL use that list as the resolved pins for the opened article. When not provided, the component SHALL derive pins by filtering the shared `usePinsSupabase` pin list for rows whose `source_document_uid` matches the opened document's uid.

Filtering SHALL use the same document uid resolution already used for pin capture context (`document_uid` preferred, `id` fallback).

#### Scenario: Explicit pins prop from pin board

- **WHEN** a caller passes a `pins` array containing all pins for the opened article
- **THEN** the article view SHALL use that array for tab visibility and panel content without requiring a separate fetch

#### Scenario: Explorer resolves pins from loaded project store

- **WHEN** the explorer opens an article modal without an explicit `pins` prop and the shared pin store contains pins for that article's `source_document_uid`
- **THEN** the **Your pins** tab SHALL appear and list those pins

#### Scenario: New pin created while article is open

- **WHEN** the user creates a pin for the opened article while the modal is open and the pin is persisted to the shared store
- **THEN** the **Your pins** tab SHALL appear (if it was hidden) or update its count without requiring a page reload

### Requirement: Article view removes pins-after slot

The article view component SHALL NOT expose a `#pins-after` slot or render pins outside the primary tab system. Callers that previously injected a footer pins section SHALL rely on the **Your pins** tab instead.

#### Scenario: No footer pins block

- **WHEN** the article view renders with pins for the document
- **THEN** pins SHALL appear only inside the **Your pins** tab panel and SHALL NOT appear as a footer below all tabs
