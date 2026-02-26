<template>
  <section class="relative p-4">
    <!-- Property selector and pagination -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-neutral-700">{{ $t('viewModes.showProperty') }}:</label>
        <USelect
          v-model="selectedProperty"
          :items="selectItems"
          class="w-64"
        />
      </div>
      <UButton
        variant="outline"
        size="sm"
        label="Select all"
        @click="toggleSelectAll(results)"
        class="flex items-center gap-2"
      >
        {{ sel.isAllSelected(results) ? "Unselect all" : "Select all" }}
      </UButton>
      
      <div class="flex items-center gap-2 text-sm text-neutral-600">
        <button class="p-1 hover:bg-neutral-100 rounded">
          <Icon name="mdi:chevron-left" class="w-5 h-5" />
        </button>
        <span>1 / 5</span>
        <button class="p-1 hover:bg-neutral-100 rounded">
          <Icon name="mdi:chevron-right" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Grid display -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="hit in results"
        :key="hit.id"
        :class="[
          'bg-white rounded-md shadow-sm hover:shadow-lg transition-shadow overflow-hidden',
          isSelected(hit.id) 
            ? 'ring-2 ring-primary-500 border-primary-200' 
            : 'border border-neutral-200'
        ]"
      >
        <Pin
          @pinned="() => handlePinned(hit)"
          @unpinned="() => handleUnpinned(hit)"
        >
          <div class="h-full p-4">
            <div class="flex justify-start items-start gap-2 mb-2">
              <UCheckbox
                :model-value="isSelected(hit.id)"
                @update:model-value="() => toggleSelection(hit)"
                color="primary"
                size="xs"
                @click.stop
              />
              <div 
                @click="handleDocumentClick(hit.document)" 
                class="cursor-pointer flex-1"
              >
                <h3 class="font-semibold text-neutral-900 leading-tight text-sm mb-2">
                  {{ hit.document.title }}
                </h3>
                
                <div class="text-sm text-neutral-600">
                  <div
                    v-if="isLoading(hit.id)"
                    class="flex items-center justify-center py-8"
                  >
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
                  </div>
                  <template v-else>
                    <div v-if="getSummary(hit.id)" class="space-y-2">
                      <p
                        class="text-sm text-neutral-800 font-medium"
                        v-html="renderMarkdown(getSummary(hit.id).data)"
                      ></p>
                      <div
                        class="prose prose-sm max-w-none"
                        v-html="renderMarkdown(getSummary(hit.id).summary)"
                      ></div>
                    </div>
                    <p v-else class="line-clamp-4">{{ hit.document[selectedProperty] }}</p>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </Pin>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import MarkdownIt from "markdown-it";
import { useI18n } from "vue-i18n";
import { useSearchSelectionStore } from "@/stores/searchSelection";

const md = new MarkdownIt();
const selectedProperty = ref("subtitle");
const summaryCache = ref(new Map());
const loadingStates = ref(new Set());
const { t } = useI18n();

// Selection functionality
const sel = useSearchSelectionStore();
const isSelected = (id) => sel.isSelected(id);
const toggleSelection = (hit) =>
  sel.toggle({
    id: hit.id,
    title: hit.document?.title || "",
    document: hit.document,
  });

const selectItems = computed(() => [
  { label: t('viewModes.summary'), value: 'subtitle' },
  { label: t('viewModes.costBenefit'), value: 'cost_benefit' },
  { label: t('viewModes.implementationTime'), value: 'implementation_time' },
  { label: t('viewModes.lifetime'), value: 'lifetime' },
  { label: t('viewModes.stakeholderParticipation'), value: 'stakeholder_participation' },
  { label: t('viewModes.successLimitations'), value: 'success_limitations' }
]);

const props = defineProps({
  results: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['document-selected']);

function handleDocumentClick(doc) {
  console.log("Document clicked:", doc);
  emit('document-selected', doc);
}

function renderMarkdown(text) {
  return md.render(text);
}

function isLoading(id) {
  return loadingStates.value.has(id);
}

function getSummary(id) {
  return summaryCache.value.get(`${id}-${selectedProperty.value}`);
}

const handlePinned = (hit) => {
  console.log("Pinned:", hit.document.title);
};

const handleUnpinned = (hit) => {
  console.log("Unpinned:", hit.document.title);
};

async function fetchSummary(hit) {
  const cacheKey = `${hit.id}-${selectedProperty.value}`;

  // Skip if we already have this summary
  if (summaryCache.value.has(cacheKey)) {
    return;
  }

  // Skip for subtitle as it's already concise
  if (selectedProperty.value === "subtitle") {
    return;
  }

  const text = hit.document[selectedProperty.value];
  if (!text) return;

  loadingStates.value.add(hit.id);

  try {
    const response = await $fetch("/api/summarizeProperty", {
      method: "POST",
      body: {
        text,
        property: selectedProperty.value,
        cacheId: cacheKey,
      },
    });

    summaryCache.value.set(cacheKey, response.response);
  } catch (error) {
    console.error("Error fetching summary:", error);
  } finally {
    loadingStates.value.delete(hit.id);
  }
}

// Watch for changes in results or selectedProperty
watch(
  [() => props.results, selectedProperty],
  async ([newResults]) => {
    if (selectedProperty.value === "subtitle") {
      return;
    }

    // Process each result sequentially to avoid overwhelming the API
    for (const hit of newResults) {
      await fetchSummary(hit);
    }
  },
  { immediate: true }
);
const toggleSelectAll = () => {
  if (sel.isAllSelected(props.results)) {
    console.log("Unselecting all");
    sel.clear();
  } else {
    console.log("Selecting all");
    sel.selectAll(props.results);
  }
}




</script>

<style scoped>
.line-clamp-4 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}
</style>
