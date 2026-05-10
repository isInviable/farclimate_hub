<template>
  <header class="border-b border-neutral-darkest bg-neutral-lightest">
    <div class="flex items-center h-14 px-6 gap-3">
      <!-- Project menu trigger -->
      <UDropdownMenu :items="projectMenuItems" :ui="{ content: 'w-64' }">
        <button
          type="button"
          class="inline-flex items-center justify-center w-7 h-7 border border-neutral-darkest text-neutral-darkest hover:bg-neutral-darkest hover:text-neutral-lightest transition-colors"
          aria-label="Project menu"
        >
          <UIcon name="material-symbols-light:menu" class="w-4 h-4" />
        </button>
      </UDropdownMenu>

      <!-- PROJECT eyebrow -->
      <span class="font-mono uppercase text-2xs font-bold tracking-[0.18em] text-neutral-dark hidden sm:inline">
        Project
      </span>
      <span class="hidden sm:inline-block w-px h-5 bg-neutral-darkest/20" aria-hidden="true" />

      <!-- Project name (editable) -->
      <div v-if="!isEditingProject" class="flex items-center min-w-0">
        <button
          type="button"
          class="group flex items-center gap-2 min-w-0 text-left"
          @click="isDemoMode ? navigateTo(explorerLoginLink) : startEditingProject()"
        >
          <span
            class="font-display font-bold text-[20px] leading-none text-neutral-darkest truncate"
          >
            {{ isDemoMode ? 'Sign in to use projects' : (projectsStore.currentProject?.name || 'Unnamed Project') }}
          </span>
          <UIcon
            v-if="!isDemoMode"
            name="mdi:pencil"
            class="w-3.5 h-3.5 text-neutral-dark opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </button>
      </div>
      <div v-else class="flex items-center">
        <input
          ref="projectNameInput"
          v-model="editingProjectName"
          @blur="finishEditingProject"
          @keyup.enter="finishEditingProject"
          @keyup.escape="cancelEditingProject"
          class="font-display font-bold text-[20px] leading-none text-neutral-darkest bg-transparent border-b border-neutral-darkest focus:outline-none px-0 py-0.5"
        />
      </div>

      <!-- Meta line (edited, indexed) -->
      <span class="hidden md:inline-block w-px h-5 bg-neutral-darkest/20 ml-2" aria-hidden="true" />
      <span class="hidden md:inline font-mono text-2xs text-neutral-dark tracking-[0.04em]">
        {{ projectMetaLine }}
      </span>

      <div class="flex-1" />

      <!-- Right cluster -->
      <!-- Share board (only when applicable) -->
      <UPopover v-if="showShareButton" :content="{ side: 'bottom', align: 'end', sideOffset: 8 }" arrow>
        <button
          type="button"
          class="inline-flex items-center gap-2 h-9 px-3 border border-neutral-darkest bg-transparent text-neutral-darkest hover:bg-neutral-darkest/5 transition-colors"
        >
          <UIcon name="mdi:link-variant" class="w-4 h-4" />
          <span class="font-mono uppercase text-2xs font-bold tracking-[0.12em]">Share board</span>
        </button>

        <template #content>
          <div class="p-4 w-80 space-y-2">
            <div class="font-mono text-2xs text-neutral-dark uppercase tracking-widest">
              Public board link — anyone with the link can view.
            </div>
            <div class="flex items-center gap-2">
              <UInput v-model="publicLink" readonly class="flex-1" @focus="selectAll" />
              <UButton size="sm" variant="solid" color="primary" @click="copyPublicLink">
                {{ copied ? 'Copied' : 'Copy' }}
              </UButton>
            </div>
          </div>
        </template>
      </UPopover>

      <!-- Export (ghost, editorial) -->
      <button
        type="button"
        class="hidden sm:inline-flex items-center gap-2 h-9 px-3 border border-neutral-darkest bg-transparent text-neutral-darkest hover:bg-neutral-darkest/5 transition-colors"
      >
        <UIcon name="mdi:arrow-top-right" class="w-4 h-4" />
        <span class="font-mono uppercase text-2xs font-bold tracking-[0.12em]">Export</span>
      </button>

      <!-- Pins Board (primary ink button with count chip) -->
      <NuxtLink
        :to="pinsButtonLink"
        class="inline-flex items-center gap-2 h-9 pl-3 pr-1.5 border border-neutral-darkest bg-neutral-darkest text-neutral-lightest hover:bg-neutral-darker transition-colors"
      >
        <UIcon :name="pinsButtonIcon" class="w-4 h-4" />
        <span class="font-mono uppercase text-2xs font-bold tracking-[0.12em]">{{ pinsButtonLabel }}</span>
        <span
          class="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1.5 ml-1 bg-neutral-lightest text-neutral-darkest font-mono text-2xs font-bold tabular-nums"
        >
          {{ pinCount }}
        </span>
      </NuxtLink>

    </div>
  </header>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { useProjectsStore } from "@/stores/projects";
import { usePinsSupabase } from "~/composables/usePinsSupabase";
import type { Project } from "~/types/projects";
import { useAccess } from "~/composables/useAccess";

const pinsApi = usePinsSupabase();
const pinCount = computed(() => pinsApi.pins.value.length);
const projectsStore = useProjectsStore();
const { isDemoMode, isAuthenticated, requireAuthForPersistence } = useAccess();
const route = useRoute();

// Lightweight relative-time formatter for the project meta line
function relativeTimeFromNow(input?: string | Date | null): string | null {
  if (!input) return null;
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `edited ${diffMin}m ago`;
  if (diffHr < 24) return `edited ${diffHr}h ago`;
  if (diffDay < 30) return `edited ${diffDay}d ago`;
  const diffMo = Math.round(diffDay / 30);
  if (diffMo < 12) return `edited ${diffMo}mo ago`;
  return `edited ${Math.round(diffMo / 12)}y ago`;
}

const projectMetaLine = computed(() => {
  const project = projectsStore.currentProject as { updated_at?: string; created_at?: string } | null;
  const stamp = relativeTimeFromNow(project?.updated_at || project?.created_at);
  const pieces: string[] = [];
  if (stamp) pieces.push(stamp);
  if (pinCount.value > 0) pieces.push(`${pinCount.value} pinned`);
  return pieces.join(' · ');
});

const explorerLoginLink = computed(() => {
  const returnTo = route?.fullPath && route.fullPath !== "/login" ? route.fullPath : "/explorer/explorer";
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
});

// Project editing state
const isEditingProject = ref(false);
const editingProjectName = ref('');
const projectNameInput = ref<HTMLInputElement>();

// Initialize projects store on mount
onMounted(() => {
  projectsStore.initialize();
});

watch(
  [() => projectsStore.currentProjectId, isAuthenticated],
  ([id, authed]) => {
    if (authed && id) void pinsApi.loadPinsForProject(id as string);
    else void pinsApi.loadPinsForProject(null);
  },
  { immediate: true }
);

// Dynamic pins button based on current route
const pinsButtonLink = computed(() => {
  const currentPath = route.path;
  if (currentPath.includes('/board')) {
    return '/explorer/explorer';
  }
  return '/explorer/board';
});

const pinsButtonIcon = computed(() => {
  const currentPath = route.path;
  if (currentPath.includes('/board')) {
    return 'material-symbols-light:explore-outline';
  }
  return 'material-symbols-light:dashboard-outline';
});

const pinsButtonLabel = computed(() => {
  const currentPath = route.path;
  if (currentPath.includes('/board')) {
    return 'Explorer';
  }
  return 'Pins Board';
});

// Public share link button visibility
const showShareButton = computed(() => {
  const p = route.path
  return p.includes('/explorer/board') && !p.includes('/explorer/board/public')
})

// Copy public link logic
const copied = ref(false)
const publicLink = computed(() => {
  const id = projectsStore.currentProjectId
  const path = `/explorer/board/public/${id ?? ''}`
  return process.client ? (new URL(path, window.location.origin)).toString() : path
})
async function copyPublicLink() {
  const url = publicLink.value
  try {
    if (process.client && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    }
    copied.value = true
    setTimeout(() => copied.value = false, 1500)
  } catch (e) {
    console.error('Failed to copy public link', e)
  }
}

function selectAll(ev: Event) {
  const target = ev.target as HTMLInputElement
  target?.select?.()
}

// Project menu items for UDropdownMenu
const projectMenuItems = computed((): DropdownMenuItem[][] => {
  const items: DropdownMenuItem[][] = [];

  items.push([
    {
      label: 'Projects Dashboard',
      icon: 'material-symbols-light:dashboard',
      onSelect: () => navigateTo('/explorer/projects')
    }
  ]);

  if (isDemoMode.value) {
    items.push([
      { label: 'Sign in to create and manage projects', type: 'label' }
    ]);
    items.push([
      {
        label: 'Sign in',
        icon: 'i-heroicons-arrow-right-on-rectangle',
        onSelect: () => navigateTo(explorerLoginLink.value)
      }
    ]);
    return items;
  }

  items.push([
    {
      label: projectsStore.currentProject?.name || 'Unnamed Project',
      type: 'label'
    }
  ]);

  const otherProjects = projectsStore.recentProjects.filter((p: Project) => p.id !== projectsStore.currentProjectId);
  if (otherProjects.length > 0) {
    const recentProjectItems: DropdownMenuItem[] = otherProjects.slice(0, 5).map((project: Project) => ({
      label: project.name,
      icon: 'i-heroicons-folder',
      onSelect: () => switchToProject(project.id)
    }));
    items.push(recentProjectItems);
  }

  items.push([
    {
      label: 'Create New Project',
      icon: 'i-heroicons-plus',
      onSelect: () => createNewProject()
    }
  ]);

  return items;
});

// Project management functions
function startEditingProject() {
  isEditingProject.value = true;
  editingProjectName.value = projectsStore.currentProject?.name || 'Unnamed Project';
  nextTick(() => {
    projectNameInput.value?.focus();
    projectNameInput.value?.select();
  });
}

async function finishEditingProject() {
  if (editingProjectName.value.trim() && projectsStore.currentProject && requireAuthForPersistence()) {
    await projectsStore.updateProjectName(projectsStore.currentProject.id, editingProjectName.value.trim());
  }
  isEditingProject.value = false;
}

function cancelEditingProject() {
  isEditingProject.value = false;
  editingProjectName.value = '';
}

function switchToProject(projectId: string) {
  projectsStore.switchToProject(projectId);
}

async function createNewProject() {
  if (!requireAuthForPersistence()) return;
  const newProject = await projectsStore.createProject('New Project');
  if (newProject) {
    nextTick(() => startEditingProject());
  }
}
</script>
