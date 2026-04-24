## Why

Pin cards on `/explorer/board` support multi-select via a hover “plus” control, but there is no in-card way to remove a pin, edit its note, or discover those actions. Users expect a compact overflow menu on each card and a clearer separation between “add to selection” and other pin actions.

## What Changes

- Add a **Nuxt UI dropdown** (three-dot trigger, top-right on the card) with **Remove** and **Edit note** items.
- **Remove** opens a **confirmation dialog** (Nuxt UI `UModal` + destructive confirm/cancel, consistent with other admin-style delete flows in the app—not a silent delete).
- **Edit note** opens a small modal or slide-over with `UTextarea` (or equivalent) and saves via existing `usePinsSupabase().updatePin` (`user_note`), then refreshes list state as today.
- **Layout**: move the existing selection **plus/check** control from top-right to **bottom-right** on hover; reserve **top-right** for the overflow menu so the two controls do not overlap.

## Capabilities

### New Capabilities

- _(none — behavior extends existing pin frontend spec.)_

### Modified Capabilities

- `human-pins-frontend`: Pin board cards SHALL expose discoverable actions (remove with confirm, edit note) and SHALL position selection vs. overflow controls as specified; delete/update SHALL continue to use `human.pins` via the existing client API.

## Impact

- **Components**: `apps/web/app/components/explorer/wf/pin-board/PinBoardCard.vue` (primary), possibly `PinBoardView.vue` if props/events need hoisting (prefer keeping logic in the card).
- **Composables**: `usePinsSupabase` (`deletePin`, `updatePin`) — no API contract change expected.
- **i18n**: New strings for menu labels, modal titles, confirm/cancel, edit note.
- **Pages**: `apps/web/app/pages/explorer/board/index.vue` unchanged unless the page must own modals (prefer self-contained card or a small child component for modals).
