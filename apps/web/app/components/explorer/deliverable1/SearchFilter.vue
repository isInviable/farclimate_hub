<template>
  <FilterComponent
    title="Search"
    icon="i-heroicons-magnifying-glass"
    filter-key="search"
    :has-visualization="false"
    :enabled="isSearchEnabled"
    @filter-change="handleFilterChange"
    @filter-clear="handleFilterClear"
    @filter-apply="handleFilterApply"
  >
    <template #controls="{ value, updateValue, isEnabled }">
      <!-- Search Input -->
      <div class="mb-4">
        <div class="flex gap-2">
          <UInput
            icon="i-lucide-search"
            size="md"
            variant="outline"
            class="grow"
            placeholder="Search..."
            :model-value="value"
            @update:model-value="updateValue"
            @keyup.enter="handleSearch"
            :disabled="!isEnabled"
          />
          <UButton
            @click="handleSearch"
            :disabled="isSearching || !isEnabled"
            size="sm"
            variant="outline"
            color="primary"
          >
            {{ isSearching ? "..." : "Search" }}
          </UButton>
        </div>
      </div>

      <!-- Recommendation Pills -->
      <div class="mb-4">
        <div class="text-xs text-gray-600 mb-2">Example queries:</div>
        <div class="flex gap-2 overflow-x-auto">
          <UButton
            v-for="pill in recommendationPills"
            :key="pill"
            variant="soft"
            color="neutral"
            size="xs"
            @click="searchWithPill(pill)"
            class="grow-0 shrink-0"
            :disabled="!isEnabled"
          >
            {{ $t(`pills.${pill}`) }}
          </UButton>
        </div>
      </div>
    </template>
  </FilterComponent>
</template>

<script setup lang="ts">
import { useSearchStore } from "@/stores/search";
import { useHybridSearch } from "@/composables/useHybridSearch";
import FilterComponent from "./FilterComponent.vue";

const props = defineProps<{
  enabled?: boolean;
}>();

const emit = defineEmits<{
  'search-results': [results: any];
  'search-error': [error: any];
  'filter-change': [key: string, value: any, enabled: boolean];
  'filter-clear': [key: string];
  'filter-apply': [key: string, value: any];
}>();

const { t } = useI18n();
const searchStore = useSearchStore();
const { search: hybridSearch, isSearching: hybridSearching, error: searchError } = useHybridSearch();

const isSearchEnabled = computed(() => props.enabled || false);
const isSearching = computed(() => hybridSearching.value);
const searchQuery = ref('');

const recommendationPills = ref([
  "forestry",
  "agriculture",
  "fishery",
  "mediterranean",
  "atlantic",
  "continental",
  "alpine",
  "boreal",
  "climateAdaptation",
  "waterManagement",
  "biodiversity",
]);

const handleFilterChange = (key: string, value: any, enabled: boolean) => {
  if (enabled && value) {
    searchQuery.value = value;
  }
};

const handleFilterClear = (key: string) => {
  searchQuery.value = '';
  searchStore.setSearchQuery('');
  searchStore.setResultsData(null);
};

const handleFilterApply = (key: string, value: any) => {
  searchQuery.value = value;
  handleSearch();
};

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return;

  if (!isSearchEnabled.value) {
    emit('filter-change', 'search', searchQuery.value, true);
  }

  await hybridSearch(searchQuery.value);

  if (searchError.value) {
    emit('search-error', searchError.value);
  } else {
    emit('search-results', searchStore.resultsData);
  }
};

const searchWithPill = (pill: string) => {
  const currentQuery = searchQuery.value.trim();
  const translatedTerm = t(`pills.${pill}`);

  if (currentQuery.toLowerCase().includes(translatedTerm.toLowerCase())) {
    return;
  }

  searchQuery.value = currentQuery ? `${currentQuery} ${translatedTerm}` : translatedTerm;
  handleSearch();
};
</script>
