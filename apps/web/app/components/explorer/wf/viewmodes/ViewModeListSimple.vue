<template>
  <section class="relative">
    <!-- list management options / pagination -->
    <div class="flex justify-between items-right px-4 py-2 mb-2">
      <div class="flex items-end gap-4">
        <div class="flex gap-1 flex-col items-start">
          <p class="text-xs opacity-50">{{ $t("common.sortBy") }}</p>
          <USelect
            name="sortby"
            id="sortby"
            class="text-sm rounded-md px-2 py-1"
          >
            <option value="name">{{ $t("common.name") }}</option>
            <option value="budget">{{ $t("common.budget") }}</option>
          </USelect>
        </div>
      </div>
    </div>
    <div class="flex">
      <!-- Main content -->
      <div class="flex-1">
        <ul v-if="isSearching">
          <li class="p-4 text-center">{{ $t("common.searching") }}</li>
        </ul>
        <template v-else-if="results && results.length > 0">
          <ul v-if="activeTab === 'default'" class="space-y-2">
            <li
              v-for="hit in results"
              :key="hit.id"
              :class="[
                'cursor-pointer px-4 py-2 border-b-4 border-neutral-50',
                isPinned(hit)
                  ? 'bg-primary-50 hover:bg-primary-100'
                  : 'bg-white hover:bg-neutral-100',
              ]"
            >
              <div class="flex justify-start items-center gap-2">
                <UCheckbox
                  :model-value="isSelected(hit.id)"
                  @update:model-value="() => toggleSelection(hit)"
                  color="primary"
                  size="md"
                />
                <Pin
                  class="mr-1 mb-2"
                  :pin-id="hit.id"
                  :pin-title="hit.document?.title || ''"
                  pin-type="result"
                  :pin-data="hit.document"
                >
                  <div
                    class="flex justify-between grow cursor-pointer text-sm font-mono"
                    @click="handleDocumentClick(hit.document)"
                  >
                    <span>{{ hit.document.title }}</span>
                  </div>
                </Pin>
              </div>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useSearchStore } from "@/stores/search";
import { useSearchSelectionStore } from "@/stores/searchSelection";

const searchStore = useSearchStore();

const props = defineProps({
  results: {
    type: Array,
    default: () => [],
  },
  isSearching: Boolean,
});

const emit = defineEmits(["document-selected"]);

const activeTab = ref("default");

const sel = useSearchSelectionStore();
const isSelected = (id) => sel.isSelected(id);
const toggleSelection = (hit) =>
  sel.toggle({
    id: hit.id,
    title: hit.document?.title || "",
    document: hit.document,
  });

// Derive pinned status from store; Pin component handles pin/unpin internally
const pinsStore = usePinsStore();
const isPinned = (hit) => pinsStore.pinnedItems?.some((i) => i.id === hit.id);

function handleDocumentClick(document) {
  emit("document-selected", document);
} 

</script>

<style scoped>
.side-panel-enter-active,
.side-panel-leave-active {
  transition: all 0.3s ease;
}

.side-panel-enter-from .main-content,
.side-panel-leave-to .main-content {
  margin-left: 0;
}
</style>
