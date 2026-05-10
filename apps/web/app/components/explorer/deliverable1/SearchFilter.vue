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
      <!-- Search Input + joined Search button -->
      <div class="mb-3 flex items-stretch -space-x-px">
        <UInput
          icon="i-lucide-search"
          size="md"
          variant="editorial"
          class="grow"
          placeholder="Search corpus…"
          :model-value="value"
          @update:model-value="updateValue"
          @keyup.enter="handleSearch"
        />
        <UButton
          @click="handleSearch"
          :disabled="isSearching"
          size="md"
          variant="editorial-solid"
        >
          {{ isSearching ? "…" : "Search" }}
        </UButton>
      </div>

      <!-- Recommendation pills (editorial chip language) -->
      <div>
        <div class="font-mono uppercase text-2xs font-bold tracking-[0.16em] text-neutral-dark mb-2">
          {{ $t('explorer.exampleQueries', 'Example queries') }}
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="pill in recommendationPills"
            :key="pill"
            type="button"
            class="inline-flex items-center px-2 py-1 border border-neutral-darkest bg-transparent text-neutral-darkest hover:bg-neutral-darkest hover:text-neutral-lightest transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono text-2xs uppercase tracking-widest"
            @click="searchWithPill(pill)"
          >
            {{ $t(`pills.${pill}`) }}
          </button>
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
