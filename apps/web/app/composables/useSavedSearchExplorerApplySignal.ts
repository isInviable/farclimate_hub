/**
 * When the user triggers "run saved search" from the pinboard while already on
 * the explorer route, `navigateTo` may not remount `FilterManager`. Bumping
 * this signal lets `FilterManager` consume `sessionStorage` and apply filters.
 */
const STATE_KEY = "explorer-saved-search-apply-tick";

export function useSavedSearchExplorerApplySignal() {
  const tick = useState<number>(STATE_KEY, () => 0);

  function notifyExplorerShouldApplyPendingSavedSearch() {
    tick.value += 1;
  }

  return { tick, notifyExplorerShouldApplyPendingSavedSearch };
}
