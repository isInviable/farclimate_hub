# human-pins-frontend (change delta)

## ADDED Requirements

### Requirement: Existing Full paper view shows two internal sections
The existing Full paper view SHALL render a paper-centric layout with two internal sections, while preserving the same sidebar entries and item count.

#### Scenario: Sidebar structure does not change
- **WHEN** this change is applied
- **THEN** the pinboard sidebar SHALL keep the same set/number of entries as before, and Full paper content SHALL be expanded internally

### Requirement: Full paper view shows full pinned papers group
In Full paper mode, the board SHALL show a first group containing pins where `body_kind === "document"` (full pinned papers), preserving deterministic ordering used by the board.

#### Scenario: Full pinned papers are listed
- **WHEN** the current pin set contains one or more `document` pins
- **THEN** the Full paper view SHALL show those rows in the **full pinned papers** group

### Requirement: Full paper view shows papers with pinned sections/content
In Full paper mode, the board SHALL show a second group containing papers that have one or more pins with `body_kind !== "document"` and non-empty `source_document_uid`. This group SHALL be grouped by `source_document_uid` so each paper appears once even if multiple fragment pins exist.

#### Scenario: Multiple fragment pins from same paper collapse to one paper entry
- **WHEN** two or more fragment/content pins share the same `source_document_uid`
- **THEN** the Full paper view SHALL show one grouped paper entry for that `source_document_uid` in the second group

#### Scenario: Fragment pins without source_document_uid are excluded from grouped paper list
- **WHEN** a fragment/content pin has null or empty `source_document_uid`
- **THEN** it SHALL NOT create a grouped paper entry in the second group of Full paper view

### Requirement: Full paper internals coexist with existing board filters
Extending Full paper internals SHALL NOT remove or replace existing `all`, body-kind section filters, or map entry behavior. Users SHALL be able to switch between these views without losing data consistency.

#### Scenario: Switching back restores existing section behavior
- **WHEN** a user leaves Full paper view and selects `all` or a body-kind section
- **THEN** the board SHALL render the existing section-based pin grid behavior as before
