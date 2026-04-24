## Context

`PinBoardCard.vue` shows pin content, optional “source missing” copy, and—when `enableSelection` is true—a single hover-revealed control: a circular button with `mdi:plus-circle-outline` / `mdi:check-circle` at **top-right** (`top-3 right-3`) wired to `usePinnedSelectionStore`. There is no affordance to delete the pin or edit `user_note` from the board. `usePinsSupabase` already exposes `deletePin` and `updatePin`; explorer `Pin.vue` demonstrates note editing via `UTextarea` and `updatePin` on popover close.

## Goals / Non-Goals

**Goals:**

- Top-right **overflow menu** (`UDropdownMenu` + `DropdownMenuItem` from `@nuxt/ui`, matching `DeliverableHeader.vue` / `projects.vue`).
- Menu actions: **Edit note** (modal with textarea, save), **Remove** (opens confirm modal, then `deletePin`).
- When selection is enabled: **plus/check** control moves to **bottom-right** on hover; overflow trigger stays **top-right** with distinct z-index so both remain clickable without overlap.
- All new user-visible strings via i18n (`pins.*` or a small dedicated key group).

**Non-Goals:**

- Changing selection store semantics or bulk actions on the board page.
- Reordering pins from the card menu (existing spec mentions reorder elsewhere).
- Altering RLS, SQL, or `usePinsSupabase` public API (only consume existing methods).
- Adding remove/edit when `enableSelection` is false **for selection** — still show overflow for manage actions if the board is always owner-facing; **Decision**: show the overflow menu whenever the authenticated board is shown (pin board page always passes `enableSelection: true`). If `PinBoardCard` is reused with `enableSelection: false`, either hide the menu or show it anyway; **prefer** showing menu whenever `usePinsSupabase` can mutate (same as delete rights). Simplest: always show overflow for board cards; selection button only when `enableSelection`.

## Decisions

1. **Dropdown component**: Use `UDropdownMenu` with a ghost/icon-only `UButton` (`i-lucide-ellipsis-vertical` or `i-heroicons-ellipsis-vertical`) as trigger—consistent with project menus.

2. **Remove confirmation**: Use `UModal` + `UAlert` + footer `UButton` cancel / destructive confirm (mirror `apps/web/app/pages/admin/aux-climate-risks.vue` delete pattern). Avoid `window.confirm` for consistency with Nuxt UI elsewhere.

3. **Edit note**: Use `UModal` (or `USlideover` on mobile if desired—**start with `UModal`** for parity with other confirm flows). Bind textarea to local state; on Save call `updatePin(id, { user_note })`, toast on failure, close on success.

4. **State ownership**: Keep modal open state and pending `pinId` inside `PinBoardCard` to avoid prop-drilling through `PinBoardView` unless reuse demands a tiny `PinBoardCardActions.vue`—optional refactor if the SFC grows.

5. **Z-index / layout**: Selection button: `bottom-3 right-3 z-20`; menu trigger: `top-3 right-3 z-30` (menu above selection ring). Body kind badge stays `top-3 left-3`; ensure menu does not cover badge on narrow cards (acceptable trade-off for md+ grid).

## Risks / Trade-offs

- **[Risk]** Dropdown click propagates or closes when opening modal → **Mitigation**: use `@select` / item callbacks that stop propagation as needed; defer modal open to `nextTick` if focus issues appear.
- **[Risk]** Delete while pin is selected → **Mitigation**: after successful delete, call `selectionStore` deselect if API exists, or ignore stale id (selection toggle uses pin id); verify `toggleSelection` / `isSelected` behavior when row disappears.
- **[Trade-off]** Two modals (confirm + edit) increase bundle slightly vs one combined sheet—acceptable for clarity.

## Migration Plan

Not applicable (frontend-only). Ship behind normal deploy; no DB migration.

## Open Questions

- None blocking: exact icon set (`lucide` vs `mdi`) should match surrounding explorer components (board already uses `Icon` from unplugin for mdi in places; header uses Nuxt UI icons—prefer `UIcon` / `i-lucide-*` on new controls for Nuxt UI consistency).
