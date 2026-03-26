# Explorer list match badges

List view rows surface active search/filter context as badges beside the title.

---

### Requirement: Row layout for title and badge region

`ViewModeListSimple` SHALL lay out each result row so the **primary column** (checkbox, pin, title) occupies approximately **80%** of the row width on `sm` breakpoints and above, and a **secondary column** occupies approximately **20%** for badges. On narrow viewports, the badge region MAY stack below or full-width while preserving readable title truncation (`min-w-0`, ellipsis as needed).

#### Scenario: Long title

- **WHEN** the article title is longer than the primary column width
- **THEN** the title SHALL truncate or wrap per design without pushing the checkbox off-screen

#### Scenario: Desktop width

- **WHEN** the viewport is at least `sm`
- **THEN** the badge column SHALL use roughly one-fifth of the row width (flex basis or max-width pattern), not consume half the row

### Requirement: Badges only for active filter dimensions

Badges SHALL appear only for filter dimensions that are **currently active** in the Pinia snapshot (at minimum **sector** and **climate impacts / hazards** when those filters are enabled and have selections). For each hit, a badge SHALL be shown only when the document carries a value that **matches** an active selected key (string normalization MAY match current explorer client filter logic, e.g. case-insensitive substring).

#### Scenario: Sector filter active and document matches

- **WHEN** sector filter is active with selection including `forestry` and the document’s `sectors` field includes a matching sector string
- **THEN** the row SHALL show at least one sector-related badge for that match

#### Scenario: Climate impact filter active

- **WHEN** hazards / climate impact filter is active and the document’s `climate_impacts` intersects the active selection
- **THEN** the row SHALL show a badge for at least one matching impact

#### Scenario: Filter inactive

- **WHEN** no sector filter is active
- **THEN** the row SHALL NOT show sector badges solely from document taxonomy

### Requirement: Biogeographical region badges when applicable

When the biogeographical regions filter is enabled and the snapshot contains active region selections, the list SHALL show badges for intersections between those selections and region-related fields on the document **if** the implementation already has a defined mapping (same as explorer filtering); if the document has no usable region field, no badge is required.

#### Scenario: Region filter without document data

- **WHEN** the region filter is active but the document lacks region metadata
- **THEN** the row SHALL show no region badges and SHALL NOT error

### Requirement: Nuxt UI and i18n

Badges SHALL use **Nuxt UI** (`UBadge` or documented equivalent). Labels SHALL use **i18n** where user-facing facet names are shown; raw backend values MAY be shown with neutral styling when no translation exists.

#### Scenario: Spanish locale

- **WHEN** the UI locale is Spanish
- **THEN** badge labels or tooltips SHALL resolve through the i18n layer for strings that have translations

### Requirement: Accessible structure

The badge group SHALL expose a sensible accessible structure (e.g. `role="group"` with `aria-label` describing “Matching filters” or equivalent translated string) so assistive technologies can distinguish title from match hints.

#### Scenario: Screen reader

- **WHEN** a screen reader focuses the badge group
- **THEN** it SHALL announce a concise purpose (via `aria-label` or surrounding semantics), not only raw tokens without context
