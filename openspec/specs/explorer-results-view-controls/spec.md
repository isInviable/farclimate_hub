# Explorer results view controls

Shared toolbar and state for explorer result viewmodes: pagination, sorting, and bulk selection using Nuxt UI.

---

### Requirement: Shared paging and sorting state

The explorer SHALL provide a reusable composable (or equivalent module) that, given the full filtered result list for a view, exposes sorted items, current page index, page size, total page count, **the total number of items in the sorted list** (same as pre-slice length), and the slice of items for the current page. Changing the sort field or the underlying result list SHALL reset the current page to the first page when the previous page would be out of range.

#### Scenario: Large result set

- **WHEN** the filtered list contains more items than the page size
- **THEN** the composable SHALL report a page count greater than one and the paged slice SHALL contain at most `pageSize` items

#### Scenario: Sort change

- **WHEN** the user changes the active sort option
- **THEN** the list order SHALL update before pagination is applied and the current page SHALL be clamped to a valid page for the new ordering

#### Scenario: Total count matches list

- **WHEN** the composable receives a filtered list of N items
- **THEN** the exposed total count SHALL equal N (after sort, before paging), including when N is zero

### Requirement: Total results visible in toolbar

Viewmodes that enable the shared toolbar with pagination SHALL display the **total** number of results in the current filtered set (the composable’s total count). The UI MAY also show the **range** of items on the current page (e.g. “1–12 of 240”) using i18n. The count SHALL update when filters or search results change.

#### Scenario: User on middle page

- **WHEN** the filtered list has multiple pages and the user is not on the first page
- **THEN** the toolbar SHALL still show the full filtered total (not only the current page size)

#### Scenario: Empty results

- **WHEN** the filtered list is empty
- **THEN** the toolbar SHALL show a total of zero (or hide the count per viewmode option) without error

### Requirement: Nuxt UI toolbar for pagination and bulk selection

Viewmodes that enable the shared toolbar SHALL render pagination using Nuxt UI (e.g. `UPagination` or documented equivalent) and SHALL render select-all / unselect-all using Nuxt UI buttons or menus. Prev/next controls SHALL not be permanently disabled when results span multiple pages. Disabled states SHALL only apply when navigation is not possible (e.g. first or last page).

#### Scenario: Multiple pages

- **WHEN** the result set spans more than one page and the user is not on the first page
- **THEN** the control to go to the previous page SHALL be enabled

#### Scenario: Select all on page

- **WHEN** the user activates select-all in the toolbar
- **THEN** every item on the current page SHALL be added to `useSearchSelectionStore` without removing selections for items on other pages unless the implementation explicitly uses a replace-all API for that action

#### Scenario: Single page of results

- **WHEN** the sorted filtered list fits in one page (length less than or equal to the configured page size)
- **THEN** the client SHALL omit the pagination control while still MAY show the total results string

### Requirement: Unselect all on page

The toolbar SHALL offer an unselect-all action that removes from the selection store every item that appears on the current page slice, without clearing selections for items that are not on the current page.

#### Scenario: Partial page deselect

- **WHEN** the user activates unselect-all while some items on the current page are selected
- **THEN** those items SHALL no longer be selected and off-page selections SHALL remain unchanged

### Requirement: Optional toolbar composition

The shared implementation SHALL allow a viewmode to omit pagination, sort, or bulk selection independently (e.g. map view may omit pagination). View-specific controls (e.g. grid property dropdown) SHALL be composable via slots or sibling markup without forking pagination logic.

#### Scenario: List view uses full toolbar

- **WHEN** the list viewmode is active
- **THEN** it SHALL enable pagination, sort, and bulk selection through the shared pattern

### Requirement: Internationalization

User-visible strings for pagination (page label, prev/next aria), **total / range labels** (e.g. “N results”, “Showing a–b of N”), sort labels, and select/unselect actions SHALL use the project i18n layer (`$t` / `useI18n`) and SHALL not hard-code English-only strings in new components.

#### Scenario: Locale active

- **WHEN** the active locale is not English
- **THEN** toolbar labels for pagination and bulk selection SHALL resolve from locale files
