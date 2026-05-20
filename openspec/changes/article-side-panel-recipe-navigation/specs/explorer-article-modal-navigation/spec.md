## ADDED Requirements

### Requirement: Top-level article modal sections

The article modal shell (`ArticleViewAI` when `chrome="modal"` and any successor used by `ArticleSidePanel`) SHALL present exactly three top-level destinations: **Recipe**, **Chat**, and **Contacts**. No other primary destinations (including a standalone **Summary**) SHALL appear at the top level.

#### Scenario: Primary navigation labels

- **WHEN** the article modal finishes loading a resolved document

- **THEN** the primary navigation SHALL expose only the three destinations above with accessible names drawn from i18n keys, and **SHALL NOT** expose summary as its own top-level sibling of recipe

### Requirement: Recipe segment submenu

When **Recipe** is active, the UI SHALL show a secondary navigation listing, in order: (1) a **Summary+** entry that targets the combined summary lead content (title/metadata column plus existing summary main content and gallery as today), (2) every visible canonical recipe markdown section in the same fixed key order as `explorer-structured-recipe`, omitting empty sections, and (3) a final **Map** entry after all markdown sections.

#### Scenario: Submenu reflects sparse recipe

- **WHEN** only `context_summary` and `benefits` contain markdown and map data exists

- **THEN** the submenu SHALL list Summary+, Context summary, Benefits, Map in that order, and SHALL omit keys with empty bodies

### Requirement: Recipe content is a single vertical scroll

All segments under **Recipe** (Summary+, each markdown section, Map) SHALL live in one vertically scrollable column. The system SHALL NOT use a paged slide deck (`SlideDeck` or equivalent one-slide-at-a-time control) for navigating between those segments inside the article modal.

#### Scenario: User reads multiple sections without paging

- **WHEN** the user activates **Recipe** and scrolls the main column

- **THEN** they SHALL be able to move continuously from Summary+ content through each rendered markdown section into the map without clicking a “next slide” control

### Requirement: Two-column recipe layout

The **Recipe** view SHALL use a two-column layout: a left column with fixed width (does not shrink when the modal resizes) and a right column that fills remaining width. The right column SHALL contain the scrollable stack of segments. The left column SHALL align vertically with the recipe view and remain visible while the right column scrolls (sticky within the modal viewport) unless viewport height is insufficient, in which case the left column SHALL be permitted to scroll independently with its own `overflow-y-auto`.

#### Scenario: Summary+ segment left column

- **WHEN** the user navigates to or scrolls to the **Summary+** segment

- **THEN** the left column SHALL display the article title, case-study label, date/metadata, and `SummaryMainLeftColumn` content consistent with the pre-change summary column

#### Scenario: Non-summary recipe segments left column

- **WHEN** the user scrolls to a canonical markdown recipe section that is not the Summary+ segment

- **THEN** the left column SHALL display a decorative visual treatment (image, illustration, or approved placeholder) that does not duplicate the markdown body, and SHALL NOT remove the fixed-width constraint

### Requirement: Chat and Contacts without submenus

**Chat** and **Contacts** SHALL each render as a single primary panel without a secondary slide or segment menu. **Contacts** SHALL surface the same contact information previously shown in the summary contacts slide.

#### Scenario: Contacts panel

- **WHEN** the user selects **Contacts**

- **THEN** the UI SHALL render the contacts experience in one scrollable region and SHALL NOT require a secondary navigator to reach the contact list

### Requirement: Accessibility of navigation

Primary and recipe secondary controls SHALL expose correct roles, labels, and keyboard operability consistent with the control primitives used (e.g. `RollingMenuRail`). When segment navigation triggers scrolling, keyboard focus SHALL NOT move into a scroll container in a way that prevents the user from reaching the browser close control or other modal actions using standard Tab navigation.

#### Scenario: Keyboard primary switch

- **WHEN** a keyboard user moves focus through the primary rail

- **THEN** each of Recipe, Chat, and Contacts SHALL be focusable and activatable with standard keys, and the active panel SHALL be programmatically associated with the control via `aria-controls` or an equivalent pattern supported by the component in use
