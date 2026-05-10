<template>
  <article class="relative group flex flex-col min-h-[220px]">
    <div class="absolute top-4 left-5 z-20">
      <EditorialEyebrow
        class="inline-flex items-center gap-1 px-2 py-1 border border-neutral-darkest bg-warm-neutral-200"
      >
        {{ $t("pins.kinds.saved_search") }}
      </EditorialEyebrow>
    </div>

    <div class="p-6 pt-14 space-y-3 flex-1 flex flex-col">
      <h3 class="font-display font-bold text-lg text-neutral-darkest line-clamp-2">
        {{ savedSearch.name }}
      </h3>
      <p class="font-sans text-sm text-neutral-dark">
        {{ $t("pins.savedSearchCardHint") }}
      </p>
      <div class="mt-auto flex items-center gap-2 flex-wrap">
        <UButton
          v-if="isAuthenticated"
          type="button"
          color="primary"
          variant="editorial-solid"
          size="sm"
          icon="i-heroicons-magnifying-glass"
          @click="onRun"
        >
          {{ $t("pins.savedSearchRunSearch") }}
        </UButton>
        <UButton
          v-if="isAuthenticated"
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
  </article>
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
