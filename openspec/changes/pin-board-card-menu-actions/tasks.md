## 1. Layout and overflow menu shell

- [x] 1.1 In `PinBoardCard.vue`, move the selection button from `top-3 right-3` to `bottom-3 right-3` (keep hover/opacity behavior and selected `opacity-100`).
- [x] 1.2 Add top-right `UDropdownMenu` with icon-only trigger (`UButton` variant ghost, ellipsis icon); set z-index above the selection overlay so clicks work.
- [x] 1.3 Define `DropdownMenuItem[][]` with **Edit note** and **Remove**; wire item handlers to open the correct modal (no delete without confirm).

## 2. Remove with confirmation

- [x] 2.1 Add `UModal` for delete confirmation: title, `UAlert` body, Cancel + destructive Confirm; on confirm call `usePinsSupabase().deletePin(pin.id)`, handle loading/error (toast or existing error surface), close modal.
- [x] 2.2 After successful delete, clear local modal state; if the pin was selected in `usePinnedSelectionStore`, deselect or verify behavior when the row disappears.

## 3. Edit note

- [x] 3.1 Add `UModal` with `UTextarea` bound to a copy of `pin.user_note`; prefill when opening; Save calls `updatePin(pin.id, { user_note })` with empty string mapped to `null` if that matches existing `Pin.vue` / API behavior.
- [x] 3.2 Close modal on success; on failure show a user-visible error without silently discarding the draft.

## 4. i18n and manual verification

- [x] 4.1 Add locale keys for menu labels, delete modal title/description, edit-note modal title, save/cancel (mirror `pins.*` conventions for `en` and `es`).
- [x] 4.2 Manual pass on `/explorer/board`: hover shows bottom-right selection control and top-right menu; remove (with confirm) and edit-note flows work.
