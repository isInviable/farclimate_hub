<template>
  <header class="">
    <div class="w-11/12 lg:w-10/12 mx-auto">
      <div class="flex justify-between items-center py-0">
        

        <!-- Left: Project Name with Edit -->
        <div class="flex items-center space-x-2">
          <div v-if="!isEditingProject" class="flex items-center space-x-2">
             <UDropdownMenu :items="projectMenuItems" :ui="{ content: 'w-64' }">
              <UButton
                variant="subtle"
                size="sm"
                icon="material-symbols-light:menu"
                class="text-primary-400 hover:text-primary-300"
              />
            </UDropdownMenu>
            <h1 
              class="font-[bourton-hand-base] text-primary-400 text-md cursor-pointer hover:text-primary-300 transition-colors group"
              @click="startEditingProject"
            >
              {{ projectsStore.currentProject?.name || 'Unnamed Project' }}
              <UIcon name="mdi:pencil" class="w-4 h-4 group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
            </h1>
           
          </div>
          <div v-else class="flex items-center space-x-2">
            <input
              ref="projectNameInput"
              v-model="editingProjectName"
              @blur="finishEditingProject"
              @keyup.enter="finishEditingProject"
              @keyup.escape="cancelEditingProject"
              class="font-[bourton-hand-base] text-primary-400 text-md bg-transparent border-b border-primary-400 focus:outline-none focus:border-primary-300"
            />
          </div>
        </div>
        <!-- Left side: Logo -->

        <div class="flex items-center">
          <img
            src="~/assets/img/farclimate_q.png"
            alt="Project Logo"
            class="h-8 w-8 mr-3"
          />
          <span class="font-sans text-primary-400 text-xs font-bold">FarClimate <br/> Knowledge Hub</span>
        </div>

        <!-- Right side: Language Switcher, Pins Board, and User Menu -->
        <div class="flex items-center space-x-4">
          <!-- Share Public Link (only on board, not in public view) -->
          <UPopover v-if="showShareButton" :content="{ side: 'bottom', align: 'end', sideOffset: 8 }" arrow>
            <UButton
              variant="outline"
              color="primary"
              size="sm"
              icon="mdi:link-variant"
            >
              Share board
            </UButton>

            <template #content>
              <div class="p-4 w-80 space-y-2">
                <div class="text-xs text-gray-500">This is a public board link. Anyone with the link can view.</div>
                <div class="flex items-center gap-2">
                  <UInput v-model="publicLink" readonly class="flex-1" @focus="selectAll" />
                  <UButton size="sm" variant="solid" color="primary" @click="copyPublicLink">
                    {{ copied ? 'Copied' : 'Copy' }}
                  </UButton>
                </div>
              </div>
            </template>
          </UPopover>

          <!-- Pin Counter -->
          <uChip
            :show="pinsStore.pinnedItems.length > 0"
            :text="pinsStore.pinnedItems.length"
            size="2xl"
          >
            <uButton
              variant="outline"
              :to="pinsButtonLink"
              :icon="pinsButtonIcon"
              :label="pinsButtonLabel"
              color="primary"
            >
            </uButton>
          </uChip>
          <!-- Language Switcher -->
          <div class="flex gap-2">
            <button
              v-for="locale in availableLocales"
              :key="locale.code"
              @click="switchLanguage(locale.code)"
              :class="[
                'px-2 py-1 rounded text-xs font-semibold transition-colors',
                currentLocale === locale.code
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-sky-800',
              ]"
            >
              {{ locale.code.toUpperCase() }}
            </button>
          </div>

          <!-- Demo mode / Sign in or user + Log out (explorer header) -->
          <template v-if="isDemoMode">
            <UBadge color="neutral" variant="soft" size="xs" class="hidden sm:inline-flex">
              Demo mode
            </UBadge>
            <UButton
              :to="explorerLoginLink"
              variant="outline"
              color="primary"
              size="sm"
              icon="i-heroicons-arrow-right-on-rectangle"
            >
              Sign in
            </UButton>
          </template>
          <template v-else>
            <span
              class="text-xs text-primary-400 truncate max-w-[140px]"
              :title="user?.email"
            >
              {{ user?.email }}
            </span>
            <UButton
              variant="ghost"
              size="sm"
              color="primary"
              icon="i-heroicons-arrow-left-on-rectangle"
              @click="handleLogout"
            >
              Log out
            </UButton>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { usePinsStore } from "@/stores/pins";
import { useProjectsStore } from "@/stores/projects";
import { useAccess } from "~/composables/useAccess";

const pinsStore = usePinsStore();
const projectsStore = useProjectsStore();
const { isDemoMode, user, signOut } = useAccess();
const route = useRoute();
const router = useRouter();

const explorerLoginLink = computed(() => {
  const returnTo = route?.fullPath && route.fullPath !== "/login" ? route.fullPath : "/explorer/explorer";
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
});

async function handleLogout() {
  await signOut();
  await router.push("/explorer/explorer");
}

// Project editing state
const isEditingProject = ref(false);
const editingProjectName = ref('');
const projectNameInput = ref<HTMLInputElement>();

// Initialize projects store on mount
onMounted(() => {
  projectsStore.initialize();
});

// Watch for pin changes and save to current project
watch(() => pinsStore.pinnedItems, () => {
  projectsStore.saveCurrentProjectPins();
}, { deep: true });

// i18n composables
const { locale, locales } = useI18n();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();

const currentLocale = computed(() => locale.value);
const availableLocales = computed(() => locales.value);

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

  // Current project info section
  items.push([
    {
      label: projectsStore.currentProject?.name || 'Unnamed Project',
      type: 'label'
    }
  ]);
  
  // Recent projects section (if there are other projects)
  const otherProjects = projectsStore.recentProjects.filter(p => p.id !== projectsStore.currentProjectId);
  if (otherProjects.length > 0) {
    const recentProjectItems: DropdownMenuItem[] = otherProjects.slice(0, 5).map(project => ({
      label: project.name,
      icon: 'i-heroicons-folder',
      onSelect: () => switchToProject(project.id)
    }));
    
    if (recentProjectItems.length > 0) {
      items.push(recentProjectItems);
    }
  }
  
  // Actions section
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

function finishEditingProject() {
  if (editingProjectName.value.trim() && projectsStore.currentProject) {
    projectsStore.updateProjectName(projectsStore.currentProject.id, editingProjectName.value.trim());
  }
  isEditingProject.value = false;
}

function cancelEditingProject() {
  isEditingProject.value = false;
  editingProjectName.value = '';
}

function switchToProject(projectId: string) {
  // Save current project's pins before switching
  projectsStore.saveCurrentProjectPins();
  projectsStore.switchToProject(projectId);
}

function createNewProject() {
  // Save current project's pins before creating new one
  projectsStore.saveCurrentProjectPins();
  const newProject = projectsStore.createProject('New Project');
  // Start editing the new project name
  nextTick(() => {
    startEditingProject();
  });
}

// Switch language function
function switchLanguage(localeCode: "en" | "es") {
  const path = switchLocalePath(localeCode);
  if (path) {
    navigateTo(path);
  }
}
</script>
