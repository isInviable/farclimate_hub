import type { SavedSearch, SavedSearchFilters } from "~/types/savedSearches";

export function useSavedSearchesSupabase() {
  const supabase = useSupabaseClient();
  const { isAuthenticated, requireAuthForPersistence } = useAccess();

  const savedSearches = ref<SavedSearch[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const _currentProjectId = ref<string | null>(null);

  async function fetchSavedSearches(projectId: string | null) {
    _currentProjectId.value = projectId;
    if (!isAuthenticated.value || !projectId) {
      savedSearches.value = [];
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const { data, error: e } = await supabase
        .schema("human")
        .from("saved_searches")
        .select("id, project_id, name, filters, created_at, updated_at")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false });
      if (e) throw e;
      savedSearches.value = (data ?? []) as SavedSearch[];
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to load saved searches";
      savedSearches.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function createSavedSearch(
    projectId: string,
    name: string,
    filters: SavedSearchFilters
  ): Promise<SavedSearch | null> {
    if (!requireAuthForPersistence()) return null;
    loading.value = true;
    error.value = null;
    try {
      const { data, error: e } = await supabase
        .schema("human")
        .from("saved_searches")
        .insert({
          project_id: projectId,
          name,
          filters: filters as unknown as Record<string, unknown>,
        })
        .select("id, project_id, name, filters, created_at, updated_at")
        .single();
      if (e) throw e;
      await fetchSavedSearches(projectId);
      return data as SavedSearch;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to save search";
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteSavedSearch(id: string): Promise<boolean> {
    if (!requireAuthForPersistence()) return false;
    loading.value = true;
    error.value = null;
    try {
      const { error: e } = await supabase
        .schema("human")
        .from("saved_searches")
        .delete()
        .eq("id", id);
      if (e) throw e;
      await fetchSavedSearches(_currentProjectId.value);
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to delete saved search";
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    savedSearches: readonly(savedSearches),
    loading: readonly(loading),
    error: readonly(error),
    fetchSavedSearches,
    createSavedSearch,
    deleteSavedSearch,
  };
}
