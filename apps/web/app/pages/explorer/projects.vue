<template>
  <div class="min-h-screen bg-neutral-lightest">
    <DeliverableHeader />

    <div class="explorer-dashboard-column">
      <ProjectsDashboardHeader
        description="Each project card opens your workspace in the explorer. Use Go to explorer at the bottom of a card (or click anywhere on the card) to browse case studies."
      >
        <template #actions>
          <UButton
            v-if="isAuthenticated"
            color="primary"
            size="lg"
            icon="i-heroicons-plus"
            @click="createNewProject"
          >
            Create new project
          </UButton>
          <UButton
            v-else
            :to="loginLink"
            color="primary"
            size="lg"
            icon="i-heroicons-arrow-right-on-rectangle"
          >
            Sign in to create projects
          </UButton>
        </template>
      </ProjectsDashboardHeader>

      <!-- Demo mode: sign-in prompt -->
      <ProjectsEmptyState
        v-if="!isAuthenticated"
        heading="Sign in to manage projects"
        body="Projects are saved to your account. Sign in to create and manage projects across devices."
      >
        <UButton :to="loginLink" color="primary" size="lg">
          Sign in
        </UButton>
      </ProjectsEmptyState>

      <!-- Loading -->
      <div
        v-else-if="projectsStore.loading && projectsStore.projects.length === 0"
        class="flex justify-center py-16"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="size-8 animate-spin text-primary-600"
        />
      </div>

      <!-- Projects grid (authenticated) -->
      <div
        v-else
        class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <ProjectCard
          v-for="project in sortedProjects"
          :key="project.id"
          :project="project"
          :pin-count="pinCountForProject(project)"
          :is-current="projectsStore.currentProjectId === project.id"
          :menu-items="getProjectMenuItems(project)"
        />

        <ProjectsEmptyState
          v-if="
            isAuthenticated &&
              projectsStore.projects.length === 0 &&
              !projectsStore.loading
          "
          heading="No projects yet"
          body="Create your first project to start organizing your climate adaptation research and pinned items."
        >
          <UButton
            color="primary"
            size="lg"
            icon="i-heroicons-plus"
            @click="createNewProject"
          >
            Create your first project
          </UButton>
        </ProjectsEmptyState>
      </div>

      <ProjectsStatisticsSection
        v-if="isAuthenticated && projectsStore.projects.length > 0"
        :total-projects="projectsStore.projects.length"
        :total-pins="totalPins"
        :most-active-name="mostActiveProject?.name ?? null"
      />
    </div>

    <UModal v-model:open="showCreateModal" title="Create new project">
      <template #body>
        <UInput
          v-model="newProjectName"
          class="w-full"
          variant="editorial"
          placeholder="Enter project name…"
          @keyup.enter="confirmCreateProject"
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="cancelCreateProject">
            Cancel
          </UButton>
          <UButton
            color="primary"
            :disabled="!newProjectName.trim() || creating"
            :loading="creating"
            @click="confirmCreateProject"
          >
            Create project
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useProjectsStore } from "@/stores/projects";
import { usePinsSupabase } from "~/composables/usePinsSupabase";
import { useAccess } from "~/composables/useAccess";
import ProjectCard from "~/components/explorer/projects/ProjectCard.vue";
import ProjectsDashboardHeader from "~/components/explorer/projects/ProjectsDashboardHeader.vue";
import ProjectsEmptyState from "~/components/explorer/projects/ProjectsEmptyState.vue";
import ProjectsStatisticsSection from "~/components/explorer/projects/ProjectsStatisticsSection.vue";
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Project } from "~/types/projects";

definePageMeta({
  title: "Projects Dashboard",
  description:
    "Manage your climate adaptation research projects and their pinned items.",
  layout: "explorer",
});

useHead({
  title: "Projects Dashboard - Deliverable 1",
  meta: [
    {
      name: "description",
      content:
        "Manage your climate adaptation research projects and their pinned items.",
    },
  ],
});

const route = useRoute();
const projectsStore = useProjectsStore();
const pinsApi = usePinsSupabase();
const { isAuthenticated } = useAccess();

const pinCounts = ref<Record<string, number>>({});

async function refreshPinCounts() {
  if (!isAuthenticated.value) {
    pinCounts.value = {};
    return;
  }
  const ids = projectsStore.projects.map((p) => p.id);
  pinCounts.value = await pinsApi.fetchPinCountsByProjectId(ids);
}

const loginLink = computed(() => {
  const returnTo =
    route?.fullPath && route.fullPath !== "/login"
      ? route.fullPath
      : "/explorer/projects";
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
});

const showCreateModal = ref(false);
const newProjectName = ref("");
const creating = ref(false);

const sortedProjects = computed(() =>
  [...projectsStore.projects].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
);

function pinCountForProject(project: Project): number {
  return pinCounts.value[project.id] ?? 0;
}

const totalPins = computed(() =>
  Object.values(pinCounts.value).reduce((a, n) => a + n, 0)
);

const mostActiveProject = computed(() => {
  if (projectsStore.projects.length === 0) return null;
  let best: Project | null = null;
  let bestN = -1;
  for (const p of projectsStore.projects) {
    const n = pinCounts.value[p.id] ?? 0;
    if (n > bestN) {
      bestN = n;
      best = p;
    }
  }
  return bestN > 0 ? best : projectsStore.projects[0] ?? null;
});

function createNewProject() {
  if (!isAuthenticated.value) return;
  newProjectName.value = "";
  showCreateModal.value = true;
}

async function confirmCreateProject() {
  if (!newProjectName.value.trim()) return;
  creating.value = true;
  try {
    const created = await projectsStore.createProject(
      newProjectName.value.trim()
    );
    if (created) {
      showCreateModal.value = false;
      newProjectName.value = "";
      await refreshPinCounts();
    }
  } finally {
    creating.value = false;
  }
}

function cancelCreateProject() {
  showCreateModal.value = false;
  newProjectName.value = "";
}

async function renameProject(projectId: string) {
  const project = projectsStore.projects.find((p) => p.id === projectId);
  if (!project) return;
  const newName = prompt("Enter new project name:", project.name);
  if (newName?.trim() && newName.trim() !== project.name) {
    await projectsStore.updateProjectName(projectId, newName.trim());
  }
}

async function deleteProjectAction(projectId: string) {
  const project = projectsStore.projects.find((p) => p.id === projectId);
  if (!project) return;
  const confirmDelete = confirm(
    `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
  );
  if (confirmDelete) {
    await projectsStore.deleteProject(projectId);
  }
}

function getProjectMenuItems(project: Project): DropdownMenuItem[][] {
  return [
    [
      {
        label: "Rename Project",
        icon: "i-heroicons-pencil",
        onSelect: () => renameProject(project.id),
      },
      {
        label: "Delete Project",
        icon: "i-heroicons-trash",
        color: "error",
        onSelect: () => deleteProjectAction(project.id),
      },
    ],
  ];
}

watch(
  () => projectsStore.projects.map((p) => p.id).join(","),
  () => {
    void refreshPinCounts();
  }
);

onMounted(() => {
  void projectsStore.initialize().then(() => refreshPinCounts());
});
</script>
