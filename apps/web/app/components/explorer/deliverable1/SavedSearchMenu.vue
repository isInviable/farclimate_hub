<template>
  <UPopover v-if="!isDemoMode" :content="{ side: 'bottom', align: 'start', sideOffset: 8 }">
    <UButton
      variant="ghost"
      color="neutral"
      size="xs"
      icon="mdi:dots-vertical"
      aria-label="Saved searches"
    />

    <template #content="{ close }">
      <div class="w-64 py-1">
        <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Saved Searches
        </div>

        <!-- Saved search list -->
        <div v-if="savedSearches.length > 0" class="max-h-48 overflow-y-auto">
          <button
            v-for="item in savedSearches"
            :key="item.id"
            class="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            @click="handleLoad(item, close)"
          >
            <span class="truncate">{{ item.name }}</span>
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              icon="i-heroicons-trash"
              class="opacity-0 group-hover:opacity-100 shrink-0 hover:text-red-500!"
              aria-label="Delete saved search"
              @click.stop="handleDelete(item.id)"
            />
          </button>
        </div>

        <!-- Empty state -->
        <div v-else class="px-3 py-3 text-xs text-gray-400 text-center">
          No saved searches yet
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-200 my-1" />

        <!-- Save current search -->
        <div v-if="!isSaving" class="px-1 py-1">
          <button
            class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors"
            @click="isSaving = true"
          >
            <UIcon name="i-heroicons-bookmark" class="w-4 h-4" />
            Save current search
          </button>
        </div>

        <!-- Save form -->
        <div v-else class="px-3 py-2 space-y-2">
          <UInput
            ref="nameInputRef"
            v-model="newSearchName"
            placeholder="Search name…"
            size="sm"
            autofocus
            @keyup.enter="handleSave(close)"
            @keyup.escape="cancelSave"
          />
          <div class="flex gap-1 justify-end">
            <UButton size="xs" variant="ghost" color="neutral" @click="cancelSave">
              Cancel
            </UButton>
            <UButton
              size="xs"
              variant="solid"
              color="primary"
              :disabled="!newSearchName.trim()"
              :loading="composable.loading.value"
              @click="handleSave(close)"
            >
              Save
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import type { SavedSearchFilters, SavedSearch } from "~/types/savedSearches";
import { useProjectsStore } from "@/stores/projects";

interface Props {
  filters: Record<string, any>
  enabledFilters: Record<string, boolean>
  searchQuery: string
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'load-search': [state: SavedSearchFilters]
}>();

const { isDemoMode } = useAccess();
const projectsStore = useProjectsStore();
const composable = useSavedSearchesSupabase();

const savedSearches = computed(() => composable.savedSearches.value);
const isSaving = ref(false);
const newSearchName = ref("");
const nameInputRef = ref<HTMLInputElement>();

function handleLoad(item: SavedSearch, closeFn: () => void) {
  emit("load-search", item.filters);
  closeFn();
}

async function handleDelete(id: string) {
  await composable.deleteSavedSearch(id);
}

async function handleSave(closeFn: () => void) {
  const name = newSearchName.value.trim();
  if (!name) return;

  const projectId = projectsStore.currentProjectId;
  if (!projectId) return;

  const state: SavedSearchFilters = {
    searchQuery: props.searchQuery,
    enabledFilters: { ...props.enabledFilters },
    filters: JSON.parse(JSON.stringify(props.filters)),
  };

  const created = await composable.createSavedSearch(projectId, name, state);
  if (created) {
    cancelSave();
    closeFn();
  }
}

function cancelSave() {
  isSaving.value = false;
  newSearchName.value = "";
}

watch(
  () => projectsStore.currentProjectId,
  (id) => {
    composable.fetchSavedSearches(id);
  },
  { immediate: true }
);
</script>
