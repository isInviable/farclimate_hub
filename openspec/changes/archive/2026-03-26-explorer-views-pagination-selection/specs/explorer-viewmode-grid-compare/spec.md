# Delta: Explorer view mode grid compare

## MODIFIED Requirements

### Requirement: Nuxt UI for grid controls

The grid comparison view SHALL use Nuxt UI components for interactive controls (select, buttons, text entry, **and pagination**) in line with project standards. Pagination SHALL be functional: it SHALL reflect the real number of pages for the current filtered result set and SHALL change which hits are rendered when the user changes page. The shared explorer results toolbar pattern (`explorer-results-view-controls`) SHALL be used for pagination and bulk selection controls so behavior matches other viewmodes. Raw HTML `<button>` elements used only as styled placeholders SHALL be replaced with Nuxt UI equivalents (e.g. `UButton` with icons) so styling and accessibility match the rest of the explorer.

#### Scenario: Custom prompt visible

- **WHEN** the user selects the custom comparison option
- **THEN** the text entry SHALL be implemented with Nuxt UI form controls (e.g. `UTextarea` within `UFormField`)

#### Scenario: Pagination navigates grid rows

- **WHEN** the filtered result set is larger than one page and the user moves to the next page
- **THEN** the grid SHALL render the hits belonging to that page and pagination controls SHALL remain enabled or disabled according to position (not globally disabled)

### Requirement: Article cap and cost warning in the grid

To limit token spend, the grid SHALL NOT trigger AI summary batch requests when the number of target articles exceeds a configured maximum (currently 30), aligned between client (`GRID_AI_SUMMARY_MAX_ARTICLES` or equivalent) and server batch `MAX_ITEMS`. Target articles SHALL be defined as: if one or more rows are selected via checkboxes, only those selected hits that appear in the **current filtered result set**; otherwise all hits **currently rendered on the grid** (i.e. the current page when pagination is enabled, or all rendered rows when the view shows a single unpaginated list). When over the limit, the UI SHALL show a visible warning (e.g. `UAlert`) explaining the cap and SHALL disable or skip batch AI actions until the user narrows results, changes page, or selects fewer articles.

#### Scenario: Too many visible results on page, none selected

- **WHEN** the grid’s **current page** shows more than the maximum articles and no checkboxes are selected
- **THEN** the client SHALL NOT call the batch summarize API and SHALL show the cost-limit message

#### Scenario: Too many selected

- **WHEN** the user has selected more than the maximum articles
- **THEN** the client SHALL NOT call the batch summarize API and SHALL show the cost-limit message referencing selection

#### Scenario: Under limit

- **WHEN** the target article count is at or below the maximum and a non-subtitle comparison mode requests summaries
- **THEN** the client MAY call `POST /api/summarizePropertyBatch` with one item per target hit that has non-empty bounded text
