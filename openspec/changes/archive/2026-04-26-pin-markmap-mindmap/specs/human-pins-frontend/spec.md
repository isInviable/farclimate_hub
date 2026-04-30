## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Pin body and note render per body_kind

The frontend SHALL render `body.data` according to `body_kind` using an application registry (extensible list). It SHALL display `user_note` when non-empty (same card or detail as the pin). Unknown `body_kind` values SHALL show a safe fallback (e.g. JSON snippet or generic card) without breaking the list.

#### Scenario: Known kind renders structured content

- **WHEN** `body_kind` matches a registered renderer (e.g. text segment, link, contact, mind map)
- **THEN** the UI SHALL show the appropriate layout using `body.v === 1` envelope

#### Scenario: Mind map kind renders structured preview

- **WHEN** `body_kind` is the mind-map dedicated value and `body.data.markdown` is a non-empty string
- **THEN** the UI SHALL render a mind-map preview or embedded viewer using that markdown (and optional `yaml`) without executing untrusted scripts beyond the existing markmap stack

### Requirement: New capture body kinds render safely

The pinboard frontend SHALL render body kinds introduced by this capture flow through explicit render mappings when available and through the existing safe fallback when unavailable. Unknown body kinds SHALL NOT break the pin list, board card menu, note rendering, source navigation, or map grouping behavior.

#### Scenario: Known new body kind renders with appropriate preview

- **WHEN** the board displays a pin created from selected text, a recipe section, an AI summary, a chat response, a grid compare summary, or a mind map and a renderer exists for that `body_kind`
- **THEN** the card SHALL show an appropriate preview using `body.data` and SHALL still show `user_note` when non-empty

#### Scenario: Unknown new body kind falls back safely

- **WHEN** the board displays a pin whose `body_kind` has no specific renderer
- **THEN** the card SHALL render a safe generic preview and keep board interactions usable
