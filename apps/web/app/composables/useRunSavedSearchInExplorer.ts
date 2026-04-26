import type { SavedSearchFilters } from "~/types/savedSearches";
import { setPendingSavedSearchApply } from "~/utils/pendingSavedSearchExplorer";
import { useSavedSearchExplorerApplySignal } from "~/composables/useSavedSearchExplorerApplySignal";

/**
 * Applies a saved search on the explorer: persists intent in sessionStorage,
 * then navigates to the explorer route or bumps the apply signal if already there.
 */
export function useRunSavedSearchInExplorer() {
  const projectsStore = useProjectsStore();
  const route = useRoute();
  const localePath = useLocalePath();
  const { notifyExplorerShouldApplyPendingSavedSearch } =
    useSavedSearchExplorerApplySignal();

  async function runSavedSearch(filters: SavedSearchFilters) {
    const projectId = projectsStore.currentProjectId;
    if (!projectId) return;
    setPendingSavedSearchApply({ projectId, filters });
    const explorerHref = localePath("/explorer/explorer");
    if (route.path === explorerHref) {
      notifyExplorerShouldApplyPendingSavedSearch();
      return;
    }
    await navigateTo(explorerHref);
  }

  return { runSavedSearch };
}
