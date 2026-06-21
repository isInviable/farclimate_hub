import { defineStore } from "pinia";
import type { Project } from "~/types/projects";

export type { Project };

export const useProjectsStore = defineStore("projects", () => {
  const supabase = useProjectsSupabase();
  const profilePrefs = useProfilePreferences();
  const { isAuthenticated } = useAccess();

  const currentProjectId = ref<string | null>(null);

  const projects = computed(() => supabase.projects.value);

  const currentProject = computed(() =>
    supabase.projects.value.find((p) => p.id === currentProjectId.value) ?? null
  );

  const recentProjects = computed(() =>
    [...supabase.projects.value]
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, 10)
  );

  async function initialize() {
    if (!isAuthenticated.value) {
      currentProjectId.value = null;
      return;
    }
    await supabase.fetchProjects();

    // Tier 1: localStorage (sync, fast)
    const stored = supabase.getStoredCurrentProjectId();
    let resolved = supabase.validateCurrentProjectId(stored);

    // Tier 2: profile preferences (async, cross-device)
    if (!resolved) {
      const remoteId = await profilePrefs.getLastProjectId();
      resolved = supabase.validateCurrentProjectId(remoteId);
      if (resolved) supabase.setStoredCurrentProjectId(resolved);
    }

    // Tier 3: most recently updated project
    if (!resolved) {
      const first = supabase.projects.value[0];
      if (first) {
        resolved = first.id;
        supabase.setStoredCurrentProjectId(resolved);
        profilePrefs.setLastProjectId(resolved);
      }
    }

    currentProjectId.value = resolved;
  }

  async function createProject(name: string = "Unnamed Project"): Promise<Project | null> {
    const created = await supabase.createProject(name);
    if (created) {
      currentProjectId.value = created.id;
      supabase.setStoredCurrentProjectId(created.id);
      profilePrefs.setLastProjectId(created.id);
      return created;
    }
    return null;
  }

  function switchToProject(projectId: string, _options?: { readOnly?: boolean }) {
    const project = supabase.projects.value.find((p) => p.id === projectId);
    if (project) {
      currentProjectId.value = projectId;
      supabase.setStoredCurrentProjectId(projectId);
      profilePrefs.setLastProjectId(projectId);
      return project;
    }
    return null;
  }

  async function updateProjectName(projectId: string, newName: string) {
    await supabase.updateProject(projectId, { name: newName });
  }

  async function deleteProject(projectId: string): Promise<boolean> {
    const ok = await supabase.deleteProject(projectId);
    if (ok && currentProjectId.value === projectId) {
      const next = supabase.validateCurrentProjectId(null);
      currentProjectId.value = next;
      supabase.setStoredCurrentProjectId(next);
    }
    return ok;
  }

  function getAllProjects(): Project[] {
    return [...supabase.projects.value];
  }

  // Re-run initialization when auth state changes (handles async session load on refresh)
  watch(isAuthenticated, (authed) => {
    if (authed && !currentProjectId.value) {
      initialize();
    } else if (!authed) {
      currentProjectId.value = null;
    }
  });

  return {
    projects,
    currentProjectId,
    currentProject,
    recentProjects,
    createProject,
    switchToProject,
    updateProjectName,
    deleteProject,
    initialize,
    getAllProjects,
    loading: supabase.loading,
    error: supabase.error,
    fetchProjects: supabase.fetchProjects,
  };
});
