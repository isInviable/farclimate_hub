import { defineStore } from "pinia";
import type { Project } from "~/types/projects";

export type { Project };

export const useProjectsStore = defineStore("projects", () => {
  const supabase = useProjectsSupabase();
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
    const stored = supabase.getStoredCurrentProjectId();
    const validated = supabase.validateCurrentProjectId(stored);
    currentProjectId.value = validated;
    if (validated) supabase.setStoredCurrentProjectId(validated);
    else {
      const first = supabase.projects.value[0];
      if (first) {
        currentProjectId.value = first.id;
        supabase.setStoredCurrentProjectId(first.id);
      }
    }
  }

  async function createProject(name: string = "Unnamed Project"): Promise<Project | null> {
    const created = await supabase.createProject(name);
    if (created) {
      currentProjectId.value = created.id;
      supabase.setStoredCurrentProjectId(created.id);
      return created;
    }
    return null;
  }

  function switchToProject(projectId: string, _options?: { readOnly?: boolean }) {
    const project = supabase.projects.value.find((p) => p.id === projectId);
    if (project) {
      currentProjectId.value = projectId;
      supabase.setStoredCurrentProjectId(projectId);
      return project;
    }
    return null;
  }

  async function updateProjectName(projectId: string, newName: string) {
    await supabase.updateProject(projectId, { name: newName });
  }

  async function deleteProject(projectId: string) {
    const ok = await supabase.deleteProject(projectId);
    if (ok && currentProjectId.value === projectId) {
      const next = supabase.validateCurrentProjectId(null);
      currentProjectId.value = next;
      supabase.setStoredCurrentProjectId(next);
    }
  }

  function getAllProjects(): Project[] {
    return [...supabase.projects.value];
  }

  function saveCurrentProjectPins() {
    // Pins are not persisted to project in DB in this change; no-op.
  }

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
    saveCurrentProjectPins,
    loading: supabase.loading,
    error: supabase.error,
    fetchProjects: supabase.fetchProjects,
  };
});
