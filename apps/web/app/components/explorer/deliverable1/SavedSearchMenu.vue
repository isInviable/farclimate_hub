<template>
  <UPopover v-if="!isDemoMode" :content="{ side: 'bottom', align: 'start', sideOffset: 8 }">
    <slot>
      <UButton
        variant="ghost"
        color="neutral"
        size="xs"
        icon="mdi:dots-vertical"
        aria-label="Saved searches"
      />
    </slot>

    <template #content="{ close }">
      <div class="w-64 py-1">
        <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {{ $t("pins.savedSearchMenuHeading") }}
        </div>

        <div v-if="savedSearches.length > 0" class="max-h-48 overflow-y-auto">
          <div
            v-for="item in savedSearches"
            :key="item.id"
            class="group flex items-center gap-1 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <button
              type="button"
              class="min-w-0 flex-1 text-left truncate px-1 py-0.5 rounded text-gray-700"
              @click="handleLoad(item, close)"
            >
              {{ item.name }}
            </button>
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              icon="i-heroicons-trash"
              class="shrink-0 opacity-70 group-hover:opacity-100 hover:text-red-500!"
              :aria-label="$t('pins.deleteSavedSearchAria')"
              @click.stop="handleDelete(item.id)"
            />
          </div>
        </div>

        <div v-else class="px-3 py-3 text-xs text-gray-400 text-center">
          {{ $t("pins.savedSearchMenuEmpty") }}
        </div>

        <template v-if="variant === 'full'">
          <div class="border-t border-gray-200 my-1" />

          <div v-if="!isSaving" class="px-1 py-1">
            <button
              type="button"
              class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors"
              @click="isSaving = true"
            >
              <UIcon name="i-heroicons-bookmark" class="w-4 h-4" />
              {{ $t("pins.savedSearchSaveCurrent") }}
            </button>
          </div>

          <div v-else class="px-3 py-2 space-y-2">
            <UInput
              ref="nameInputRef"
              v-model="newSearchName"
              :placeholder="$t('pins.savedSearchNamePlaceholder')"
              size="sm"
              autofocus
              @keyup.enter="handleSave(close)"
              @keyup.escape="cancelSave"
            />
            <div class="flex gap-1 justify-end">
              <UButton size="xs" variant="ghost" color="neutral" @click="cancelSave">
                {{ $t("pins.savedSearchCancel") }}
              </UButton>
              <UButton
                size="xs"
                variant="solid"
                color="primary"
                :disabled="!newSearchName.trim()"
                :loading="composable.loading.value"
                @click="handleSave(close)"
              >
                {{ $t("pins.savedSearchSave") }}
              </UButton>
            </div>
          </div>
        </template>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import type { SavedSearchFilters, SavedSearch } from "~/types/savedSearches";
import { useProjectsStore } from "@/stores/projects";

const props = withDefaults(
  defineProps<{
    /** Required when `variant` is `full` (save current search). */
    filters?: Record<string, unknown>
    enabledFilters?: Record<string, boolean>
    searchQuery?: string
    /** `full`: filter sidebar (list + save). `list-only`: same list, apply via explorer handoff (e.g. floating bar). */
    variant?: "full" | "list-only"
  }>(),
  {
    filters: () => ({}),
    enabledFilters: () => ({}),
    searchQuery: "",
    variant: "full",
  }
);

const emit = defineEmits<{
  "load-search": [state: SavedSearchFilters]
}>();

const { isDemoMode, requireAuthForPersistence } = useAccess();
const projectsStore = useProjectsStore();
const composable = useSavedSearchesSupabase();
const { runSavedSearch } = useRunSavedSearchInExplorer();

const savedSearches = computed(() => composable.savedSearches.value);
const isSaving = ref(false);
const newSearchName = ref("");
const nameInputRef = ref<HTMLInputElement>();

function handleLoad(item: SavedSearch, closeFn: () => void) {
  if (props.variant === "list-only") {
    void runSavedSearch(item.filters);
  } else {
    emit("load-search", item.filters);
  }
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
