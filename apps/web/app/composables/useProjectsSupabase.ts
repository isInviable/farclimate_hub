import type { Project } from "~/types/projects";

const PROJECTS_STORAGE_KEY = "farclimate-current-project-id";

export function useProjectsSupabase() {
  const supabase = useSupabaseClient();
  const { isAuthenticated, requireAuthForPersistence } = useAccess();
  const { t } = useI18n();

  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  watch(
    isAuthenticated,
    (authed) => {
      if (authed) {
        // When a user signs in, load their projects.
        fetchProjects();
      } else {
        projects.value = [];
      }
    },
    { immediate: false }
  );

  async function fetchProjects() {
    if (!isAuthenticated.value) {
      projects.value = [];
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const { data, error: e } = await supabase
        .schema("human")
        .from("projects")
        .select("id, owner_user_id, name, description, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (e) throw e;
      projects.value = (data ?? []) as Project[];
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("projects.errors.load");
      projects.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function createProject(
    name: string,
    description?: string | null
  ): Promise<Project | null> {
    if (!requireAuthForPersistence()) return null;
    loading.value = true;
    error.value = null;
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        error.value = t("projects.errors.notAuthenticated");
        return null;
      }
      const user = authData.user;
      const { data: insertData, error: e } = await supabase
        .schema("human")
        .from("projects")
        .insert({
          owner_user_id: user.id,
          name: name || t("projects.unnamed"),
          description: description ?? null,
        })
        .select("id, owner_user_id, name, description, created_at, updated_at")
        .single();
      if (e) throw e;
      await fetchProjects();
      return insertData as Project;
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("projects.errors.create");
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateProject(
    id: string,
    payload: { name?: string; description?: string | null }
  ): Promise<boolean> {
    if (!requireAuthForPersistence()) return false;
    loading.value = true;
    error.value = null;
    try {
      const updates: Record<string, unknown> = {};
      if (payload.name !== undefined) updates.name = payload.name;
      if (payload.description !== undefined) updates.description = payload.description;
      const { error: e } = await supabase
        .schema("human")
        .from("projects")
        .update(updates)
        .eq("id", id);
      if (e) throw e;
      await fetchProjects();
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("projects.errors.update");
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProject(id: string): Promise<boolean> {
    if (!requireAuthForPersistence()) return false;
    loading.value = true;
    error.value = null;
    try {
      const { error: e } = await supabase
        .schema("human")
        .from("projects")
        .delete()
        .eq("id", id);
      if (e) throw e;
      await fetchProjects();
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("projects.errors.delete");
      return false;
    } finally {
      loading.value = false;
    }
  }

  function getStoredCurrentProjectId(): string | null {
    if (import.meta.client) {
      return localStorage.getItem(PROJECTS_STORAGE_KEY);
    }
    return null;
  }

  function setStoredCurrentProjectId(id: string | null) {
    if (import.meta.client) {
      if (id) localStorage.setItem(PROJECTS_STORAGE_KEY, id);
      else localStorage.removeItem(PROJECTS_STORAGE_KEY);
    }
  }

  /**
   * Validates currentProjectId against the fetched list; clears or sets to first if invalid.
   */
  function validateCurrentProjectId(currentId: string | null): string | null {
    if (!currentId) return null;
    const exists = projects.value.some((p) => p.id === currentId);
    if (exists) return currentId;
    return projects.value.length > 0 ? projects.value[0].id : null;
  }

  return {
    projects: readonly(projects),
    loading: readonly(loading),
    error: readonly(error),
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getStoredCurrentProjectId,
    setStoredCurrentProjectId,
    validateCurrentProjectId,
  };
}
