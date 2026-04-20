## ADDED Requirements

### Requirement: Pin board cards expose an overflow menu and layout for selection

The pinboard grid cards (`PinBoardCard` or successor) SHALL show a **three-dot overflow** control when the card is used on the authenticated project pinboard. The control SHALL open a Nuxt UI dropdown (`UDropdownMenu` or equivalent documented pattern) with at least **Edit note** and **Remove** entries. When multi-select is enabled for the board, the existing **selection** control (plus / check icon) SHALL appear on **hover** at the **bottom-right** of the card; the overflow control SHALL remain at the **top-right**, with layering such that both controls remain usable and do not occupy the same corner.

#### Scenario: User opens the card menu

- **WHEN** the user activates the overflow control on a pin card
- **THEN** the UI SHALL present a dropdown with **Edit note** and **Remove** actions

#### Scenario: Selection affordance position when selection is enabled

- **WHEN** `enableSelection` is true and the user hovers the card
- **THEN** the plus/check selection control SHALL be shown at the bottom-right of the card and the overflow control SHALL remain at the top-right

### Requirement: Removing a pin from the board requires confirmation

The application SHALL NOT delete a pin from the pinboard in response to a single unprefaced click. Choosing **Remove** from the card menu SHALL open a confirmation dialog (Nuxt UI modal with explicit confirm and cancel). Only after the user confirms SHALL the client call delete on `human.pins` for that pin id (via the existing authenticated client path). Cancel SHALL leave the pin unchanged.

#### Scenario: User cancels delete

- **WHEN** the user opens remove confirmation and chooses cancel (or dismisses without confirming)
- **THEN** the pin row SHALL remain and no delete request SHALL be sent

#### Scenario: User confirms delete

- **WHEN** the user confirms removal in the dialog
- **THEN** the app SHALL delete the pin for the authenticated owner and the card SHALL disappear from the board list without a full page reload (same refresh behavior as existing `deletePin` implementation)

### Requirement: Edit note from the pin board card

Choosing **Edit note** from the overflow menu SHALL open a dialog or panel where the user can view and edit `user_note`. Saving SHALL persist `user_note` through the existing update path on `human.pins` for that pin id. Empty note SHALL be stored as null or empty per existing `updatePin` conventions. Strings SHALL use the application i18n system.

#### Scenario: User saves an updated note

- **WHEN** the user edits the note and confirms save
- **THEN** the updated text SHALL appear on the card (or empty state if cleared) after persistence succeeds
