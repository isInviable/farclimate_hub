<template>
  <article class="relative group flex flex-col min-h-[220px]">
    <div
      v-if="showCardMenu"
      class="absolute top-3 right-3 z-30"
    >
      <UDropdownMenu :items="cardMenuItems" :ui="{ content: 'w-48' }">
        <UButton
          variant="ghost"
          size="sm"
          color="neutral"
          icon="i-heroicons-ellipsis-vertical"
          :aria-label="$t('pins.savedSearchCardMenuAria')"
        />
      </UDropdownMenu>
    </div>

    <div
      class="absolute top-4 left-5 z-20"
      :class="{ 'pr-10': showCardMenu }"
    >
      <UBadge
        :label="$t('pins.kinds.saved_search')"
        color="primary"
        variant="solid"
        size="sm"
        class="rounded-none px-2 font-mono uppercase tracking-wide text-2xs"
      />
    </div>

    <UModal v-model:open="isDeleteConfirmOpen" :title="deleteModalTitle">
      <template #body>
        <div class="space-y-3">
          <UAlert
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            :title="$t('pins.removeConfirmHeading')"
            :description="deleteModalDescription"
          />
          <UAlert
            v-if="deleteActionError"
            color="error"
            variant="outline"
            :title="$t('pins.savedSearchRemoveConfirmFailed')"
            :description="deleteActionError"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            type="button"
            variant="ghost"
            color="neutral"
            :disabled="deleteLoading"
            @click="isDeleteConfirmOpen = false"
          >
            {{ $t("pins.removeConfirmCancel") }}
          </UButton>
          <UButton
            type="button"
            color="error"
            variant="outline"
            :loading="deleteLoading"
            icon="i-heroicons-trash"
            @click="confirmDelete"
          >
            {{ $t("pins.savedSearchDelete") }}
          </UButton>
        </div>
      </template>
    </UModal>

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
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { SavedSearch } from "~/types/savedSearches";

const props = withDefaults(
  defineProps<{
    savedSearch: SavedSearch;
    enableSelection?: boolean;
  }>(),
  { enableSelection: true }
);

const { t } = useI18n();
const { isAuthenticated } = useAccess();
const savedApi = useSavedSearchesSupabase();
const { runSavedSearch } = useRunSavedSearchInExplorer();

const showCardMenu = computed(
  () => props.enableSelection && isAuthenticated.value
);

const isDeleteConfirmOpen = ref(false);
const deleteLoading = ref(false);
const deleteActionError = ref<string | null>(null);

const deleteModalTitle = computed(() =>
  t("pins.savedSearchRemoveConfirmTitle")
);

const deleteModalDescription = computed(() =>
  t("pins.savedSearchRemoveConfirmDescription", {
    name: props.savedSearch.name.trim() || "—",
  })
);

const cardMenuItems = computed((): DropdownMenuItem[][] => [
  [
    {
      label: t("pins.savedSearchDelete"),
      icon: "i-heroicons-trash",
      color: "error",
      onSelect: () => {
        deleteActionError.value = null;
        isDeleteConfirmOpen.value = true;
      },
    },
  ],
]);

watch(isDeleteConfirmOpen, (open) => {
  if (open) deleteActionError.value = null;
});

async function onRun() {
  await runSavedSearch(props.savedSearch.filters);
}

async function confirmDelete() {
  deleteLoading.value = true;
  deleteActionError.value = null;
  try {
    const ok = await savedApi.deleteSavedSearch(props.savedSearch.id);
    if (!ok) {
      deleteActionError.value =
        savedApi.error.value ?? t("pins.savedSearchRemoveConfirmFailed");
      return;
    }
    isDeleteConfirmOpen.value = false;
  } finally {
    deleteLoading.value = false;
  }
}
</script>
