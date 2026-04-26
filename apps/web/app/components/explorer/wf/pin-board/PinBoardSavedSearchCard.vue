<template>
  <div
    class="relative group bg-white rounded-lg shadow-md overflow-hidden border border-neutral-100"
  >
    <div class="absolute top-3 left-3 z-20">
      <span class="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
        {{ $t("pins.kinds.saved_search") }}
      </span>
    </div>

    <div class="p-6 pt-14 space-y-3">
      <h3 class="font-bold text-lg text-gray-900 line-clamp-2">
        {{ savedSearch.name }}
      </h3>
      <p class="text-sm text-neutral-600">
        {{ $t("pins.savedSearchCardHint") }}
      </p>
      <UButton
        v-if="isAuthenticated"
        type="button"
        color="primary"
        size="sm"
        icon="i-heroicons-magnifying-glass"
        @click="onRun"
      >
        {{ $t("pins.savedSearchRunSearch") }}
      </UButton>
      <div v-if="isAuthenticated" class="pt-1">
        <UButton
          type="button"
          variant="ghost"
          color="error"
          size="xs"
          icon="i-heroicons-trash"
          :aria-label="$t('pins.deleteSavedSearchAria')"
          @click="onDelete"
        >
          {{ $t("pins.savedSearchDelete") }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SavedSearch } from "~/types/savedSearches";

const props = defineProps<{
  savedSearch: SavedSearch;
}>();

const { isAuthenticated } = useAccess();
const savedApi = useSavedSearchesSupabase();
const { runSavedSearch } = useRunSavedSearchInExplorer();

async function onRun() {
  await runSavedSearch(props.savedSearch.filters);
}

async function onDelete() {
  await savedApi.deleteSavedSearch(props.savedSearch.id);
}
</script>
