<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <DeliverableHeader />

    <!-- Main Content -->
    <div class="w-11/12 lg:w-10/12 mx-auto py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              Projects Dashboard
            </h1>
            <p class="text-gray-600">
              Manage your climate adaptation research projects and their pinned
              items
            </p>
          </div>
        <UButton
          @click="createNewProject"
          icon="i-heroicons-plus"
          color="primary"
          size="lg"
        >
            Create New Project
          </UButton>
        </div>
      </div>

      <!-- Projects Grid -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <!-- Project Cards -->
        <div
          v-for="project in sortedProjects"
          :key="project.id"
          class="relative group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-primary-300"
          :class="{
            'ring-2 ring-primary-400':
              projectsStore.currentProjectId === project.id,
            'cursor-pointer': projectsStore.currentProjectId !== project.id,
          }"
          @click="switchToProject(project.id)"
        >
          <!-- Current Project Badge -->
          <div
            v-if="projectsStore.currentProjectId === project.id"
            class="absolute -top-2 -right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full font-semibold"
          >
            Current
          </div>

          <!-- Project Content -->
          <div class="p-6">
            <!-- Project Name -->
            <div class="flex items-start justify-between mb-4">
              <h3
                class="text-lg font-semibold text-gray-900 truncate flex-1 mr-2"
                :title="project.name"
              >
                {{ project.name }}
              </h3>
              <UDropdownMenu
                :items="getProjectMenuItems(project)"
                :ui="{ content: 'w-48' }"
              >
                <UButton
                  variant="ghost"
                  size="sm"
                  icon="i-heroicons-ellipsis-vertical"
                  class="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </UDropdownMenu>
            </div>

            <!-- Project Stats -->
            <div class="space-y-3">
              <!-- Pin Count -->
              <div class="flex items-center text-gray-600">
                <UIcon name="mdi:pin" class="w-4 h-4 mr-2 text-primary-500" />
                <span class="text-sm font-medium">
                  {{ project.pinnedItems?.length || 0 }}
                  {{
                    (project.pinnedItems?.length || 0) === 1 ? "pin" : "pins"
                  }}
                </span>
              </div>

              <!-- Created Date -->
              <div class="flex items-center text-gray-500">
                <Icon name="i-heroicons-calendar" class="w-4 h-4 mr-2" />
                <span class="text-xs">
                  Created {{ formatDate(project.createdAt) }}
                </span>
              </div>

              <!-- Last Accessed -->
              <div class="flex items-center text-gray-500">
                <Icon name="i-heroicons-clock" class="w-4 h-4 mr-2" />
                <span class="text-xs">
                  Last used {{ formatDate(project.lastAccessed) }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-4 pt-4 border-t border-gray-100">
              <div class="flex gap-2">
                <UButton
                  v-if="projectsStore.currentProjectId !== project.id"
                  @click.stop="switchToProject(project.id)"
                  variant="soft"
                  color="primary"
                  size="sm"
                  class="flex-1"
                >
                  Open Project
                </UButton>
                <UButton
                  v-else
                  variant="soft"
                  color="neutral"
                  size="sm"
                  class="flex-1"
                  disabled
                >
                  Active Project
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="projectsStore.projects.length === 0"
          class="col-span-full flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="bg-gray-100 rounded-full p-6 mb-4">
            <Icon
              name="i-heroicons-folder-open"
              class="w-12 h-12 text-gray-400"
            />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            No projects yet
          </h3>
          <p class="text-gray-600 mb-6 max-w-md">
            Create your first project to start organizing your climate
            adaptation research and pinned items.
          </p>
        <UButton
          @click="createNewProject"
          icon="i-heroicons-plus"
          color="primary"
          size="lg"
        >
            Create Your First Project
          </UButton>
        </div>
      </div>

      <!-- Project Statistics -->
      <div v-if="projectsStore.projects.length > 0" class="mt-12">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          Project Statistics
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Total Projects -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-primary-100 rounded-full p-3 mr-4">
                <Icon
                  name="i-heroicons-folder"
                  class="w-6 h-6 text-primary-600"
                />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Total Projects</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ projectsStore.projects.length }}
                </p>
              </div>
            </div>
          </div>

          <!-- Total Pins -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-green-100 rounded-full p-3 mr-4 ">
                <UIcon name="mdi:pin" class="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Total Pins</p>
                <p class="text-2xl font-bold text-gray-900">{{ totalPins }}</p>
              </div>
            </div>
          </div>

          <!-- Most Active Project -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-blue-100 rounded-full p-3 mr-4">
                <Icon name="i-heroicons-star" class="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">
                  Most Pinned Project
                </p>
                <p
                  class="text-lg font-semibold text-gray-900 truncate"
                  :title="mostActiveProject?.name"
                >
                  {{ mostActiveProject?.name || "N/A" }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Project Creation Modal -->
    <UModal v-model:open="showCreateModal" title="Create New Project">
      
        <template #body>
          <div class="flex justify-center grow">
            <UInput
              class="w-full"
              v-model="newProjectName"
              placeholder="Enter project name..."
              @keyup.enter="confirmCreateProject"
            />
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 grow" >
            <UButton variant="ghost" @click="cancelCreateProject">
              Cancel
            </UButton>
            <UButton
              @click="confirmCreateProject"
              :disabled="!newProjectName.trim()"
              color="primary"
            >
              Create Project
            </UButton>
          </div>
        </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useProjectsStore } from "@/stores/projects";
import { usePinsStore } from "@/stores/pins";
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Project } from "@/stores/projects";
// Page metadata
definePageMeta({
  title: "Projects Dashboard",
  description:
    "Manage your climate adaptation research projects and their pinned items.",
});

// SEO head
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

// Stores
const projectsStore = useProjectsStore();
const pinsStore = usePinsStore();

// State
const showCreateModal = ref(false);
const newProjectName = ref("");

// Computed
const sortedProjects = computed(() => {
  return [...projectsStore.projects].sort(
    (a, b) => b.lastAccessed - a.lastAccessed
  );
});

const totalPins = computed(() => {
  return projectsStore.projects.reduce(
    (total, project) => total + (project.pinnedItems?.length || 0),
    0
  );
});

const mostActiveProject = computed(() => {
  if (projectsStore.projects.length === 0) return null;
  return projectsStore.projects.reduce((most, project) => {
    const currentPins = project.pinnedItems?.length || 0;
    const mostPins = most.pinnedItems?.length || 0;
    return currentPins > mostPins ? project : most;
  });
});

// Methods
const createNewProject = () => {
  newProjectName.value = "";
  showCreateModal.value = true;
};

const confirmCreateProject = () => {
  if (newProjectName.value.trim()) {
    projectsStore.saveCurrentProjectPins(); // Save current project's pins
    projectsStore.createProject(newProjectName.value.trim());
    showCreateModal.value = false;
    newProjectName.value = "";
  }
};

const cancelCreateProject = () => {
  showCreateModal.value = false;
  newProjectName.value = "";
};

const switchToProject = (projectId: string) => {
  if (projectsStore.currentProjectId !== projectId) {
    projectsStore.saveCurrentProjectPins(); // Save current project's pins
    projectsStore.switchToProject(projectId);
    // Navigate to explorer after switching
    navigateTo("/explorer/explorer");
  }
};

const renameProject = (projectId: string) => {
  const project = projectsStore.projects.find((p) => p.id === projectId);
  if (project) {
    const newName = prompt("Enter new project name:", project.name);
    if (newName && newName.trim() && newName.trim() !== project.name) {
      projectsStore.updateProjectName(projectId, newName.trim());
    }
  }
};

const deleteProject = (projectId: string) => {
  const project = projectsStore.projects.find((p) => p.id === projectId);
  if (project) {
    const confirmDelete = confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
    );
    if (confirmDelete) {
      projectsStore.deleteProject(projectId);
    }
  }
};

const getProjectMenuItems = (project: Project): DropdownMenuItem[][] => {
  const items: DropdownMenuItem[][] = [];

  // Main actions
  items.push([
    {
      label: "Rename Project",
      icon: "i-heroicons-pencil",
      onSelect: () => renameProject(project.id),
    },
    {
      label: "Delete Project",
      icon: "i-heroicons-trash",
      color: "error",
      onSelect: () => deleteProject(project.id),
    },
  ]);

  return items;
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) {
    return "today";
  } else if (diffInDays === 1) {
    return "yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Lifecycle
onMounted(() => {
  projectsStore.initialize();
});
</script>

<style scoped>
/* Custom hover effects */
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
