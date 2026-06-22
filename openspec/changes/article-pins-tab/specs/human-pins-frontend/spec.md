# human-pins-frontend (change delta)

Delta for pin presentation inside the article drawer.

---

## MODIFIED Requirements

### Requirement: Drawer renders an optional pins-in-article section

When the opened article has one or more resolved pins (either passed explicitly by the caller or derived from the shared authenticated pin store for the article's `source_document_uid`), the article view inside the drawer SHALL surface those pins through the **Your pins** primary tab defined in capability `article-pins-tab`, not through a separate footer section in the drawer body.

When no pins exist for the opened article, the drawer SHALL NOT render a pins section or **Your pins** tab.

Callers MAY continue to pass an optional `pins` prop to `ArticleSidePanel` for contexts that do not use the authenticated pin store (for example public shared boards). The panel SHALL forward that prop to the article view for pin resolution.

#### Scenario: Pins appear as primary tab when provided

- **WHEN** the drawer opens with a non-empty pins list for the article
- **THEN** the article view SHALL show the **Your pins** primary tab with those pins and SHALL NOT render a separate footer pins card below the tab content

#### Scenario: Explorer shows pins tab when store has rows

- **WHEN** the explorer opens the article drawer without an explicit pins prop but the shared pin store contains pins for that article
- **THEN** the article view SHALL show the **Your pins** tab with the filtered pins

#### Scenario: No pins means no pins UI

- **WHEN** the drawer opens and no pins exist for the article in either the explicit prop or the shared store
- **THEN** the article view SHALL NOT show a **Your pins** tab or any pins footer section

#### Scenario: Map and card entry still pass pins context

- **WHEN** the user opens the drawer from a pin board map marker or pin card click
- **THEN** the drawer SHALL pass the grouped sibling pins for that `source_document_uid` and the **Your pins** tab SHALL list them
