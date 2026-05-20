# explorer-search-viewmode-pin-capture (change spec)

Delta for the capability introduced by change `replace-legacy-pin-with-capturable-block`. Defines capturable-only pinning for explorer **list** and **Instagram** search viewmodes after removal of the legacy `Pin` component.

---

## ADDED Requirements

### Requirement: List and Instagram viewmodes use capturable pin flow only

The explorer **list** viewmode (`ViewModeListSimple` or documented successor) and **Instagram** viewmode (`ViewModeInstagram` or documented successor) SHALL NOT reference a legacy `<Pin>` component or equivalent removed wrapper. Any user-facing pin entry point on a search hit SHALL use the same capturable pattern as other modern Explorer surfaces: **`CapturableBlock`** (or a thin component that composes it without bypassing `PinCaptureDialog`), structured payload construction via **`usePin`**, and persistence to **`human.pins`**.

#### Scenario: No unresolved Pin component

- **WHEN** the application builds the explorer web bundle
- **THEN** templates for list and Instagram viewmodes SHALL NOT reference a component registered as `Pin` from the deleted legacy path

### Requirement: Per-hit PinArticleContext for list and Instagram

For each search hit that exposes a pin control, the viewmode SHALL **`provide`** `PinArticleContext` for that hit’s knowledge document: **`documentUid`** and **`title`** from the hit’s document when available, and **`location`** when the document exposes valid coordinates, consistent with **`ViewModeGridHitContext`** behavior.

#### Scenario: Hit includes document_uid

- **WHEN** the user saves a pin from the list or Instagram viewmode for a hit whose document includes `document_uid`
- **THEN** the insert payload SHALL include that value as `source_document_uid` and a meaningful `source_title_snapshot` (at least the document title)

#### Scenario: Hit lacks document_uid

- **WHEN** the hit does not provide `document_uid`
- **THEN** pinning SHALL still be allowed and the pin SHALL follow existing degraded / missing-source rules on the board

### Requirement: List viewmode pins the title row content

In the list viewmode, the capturable region SHALL cover the same primary textual anchor the legacy `<Pin>` wrapped (typically the **article title** line). The control SHALL use **`CapturableBlock`** with appropriate **`title`**, **`payload`**, and **`preview`** so the saved pin body reflects the title text and remains consistent with **`text_segment`** (or the chosen registered `body_kind`) semantics.

#### Scenario: User pins from list row

- **WHEN** an authenticated user opens the pin capture flow from a list row that has a document title
- **THEN** the capture dialog SHALL preview meaningful text and, on save, SHALL create a pin whose body includes that title content and correct source metadata when `document_uid` is known

### Requirement: Instagram viewmode preserves bookmark affordance with capturable behavior

In the Instagram viewmode, the pin entry point SHALL remain visually consistent with a **bookmark-style** control in the post actions area. The implementation MAY use **`CapturableBlock`**’s **`#pin` slot** (or equivalent) to render the bookmark icon while retaining **`PinCaptureDialog`** and structured saves.

#### Scenario: User pins from Instagram action bar

- **WHEN** the user activates the bookmark pin control on an Instagram-style card
- **THEN** the application SHALL open the standard capture dialog and SHALL NOT rely on the removed legacy `Pin` component
