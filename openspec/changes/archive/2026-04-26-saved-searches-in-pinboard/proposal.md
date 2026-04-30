## Why

Saved searches already persist per project in `human.saved_searches`. Users should see the **same** named searches on the project pinboard as in the explorer filter menu, and jump back into explorer with one action—without duplicating data as pins or hunting only the filters menu.

## What Changes (as shipped)

- **Pinboard** loads and displays `human.saved_searches` for the active project (same source as `SavedSearchMenu`), with sidebar category **Saved searches**, a section under **All**, and per-item **Run search** / delete.
- **Apply handoff** to explorer (session one-shot + `FilterManager` consumption, optional in-page signal when already on explorer) so pinboard **Run search** matches loading from the filter menu.
- **Explicit exclusion:** the explorer **floating action bar** (`ActionBarExplorer`) does **not** include saved-search UI; access is **filter sidebar + pinboard** only.
- **No** `human.pins` rows for saved searches; no “add to pinboard” control.

## Capabilities

### New Capabilities

- `pinboard-saved-searches`: Pinboard lists the same `human.saved_searches` as the filter menu; run/delete behaviour; no duplicate picker on the explorer action bar.

### Modified Capabilities

- `human-pins-frontend`: `PinBoardView` integrates saved-search sections/cards alongside pins; action bar excludes saved searches.
- `saved-searches`: Pinboard parity and non-goals for action-bar duplication; optional `SavedSearchMenu` `variant` for reuse without requiring it on the action bar.

## Impact

- **Frontend**: `PinBoardView`, `PinBoardSavedSearchCard`, `SavedSearchMenu` (optional `variant`), `FilterManager`, `useRunSavedSearchInExplorer`, `pendingSavedSearchExplorer`, `useSavedSearchExplorerApplySignal`; `ActionBarExplorer` remains without saved-search UI.
- **Database**: None (continues to use `human.saved_searches` only).
