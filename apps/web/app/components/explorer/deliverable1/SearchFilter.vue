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
import { ref, computed } from 'vue';
import { OramaClient } from "@oramacloud/client";
import { useSearchStore } from "@/stores/search";
import FilterComponent from "./FilterComponent.vue";

// Props
const props = defineProps<{
  enabled?: boolean;
}>();

// Emits
const emit = defineEmits<{
  'search-results': [results: any];
  'search-error': [error: any];
  'filter-change': [key: string, value: any, enabled: boolean];
  'filter-clear': [key: string];
  'filter-apply': [key: string, value: any];
}>();

// Composables
const { locale, t } = useI18n();
const searchStore = useSearchStore();

// Reactive state
const isSearchEnabled = computed(() => props.enabled || false);
const isSearching = ref(false);
const searchQuery = ref('');

// Recommendation pills
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

// Initialize search client
const client = new OramaClient({
  endpoint: "https://cloud.orama.run/v1/indexes/test-climateadapt-moif4q",
  api_key: "REDACTED_ORAMA_API_KEY",
});

// Methods
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
  
  // Automatically enable the search filter when performing a search
  if (!isSearchEnabled.value) {
    emit('filter-change', 'search', searchQuery.value, true);
  }
  
  isSearching.value = true;
  searchStore.setIsSearching(true);
  
  let locale1 = locale.value;
  if (locale1 === "es") {
    locale1 = "es";
  } else {
    locale1 = "en";
  }

  try {
    const results = await client.search({
      term: searchQuery.value,
      limit: 30,
      mode: "hybrid",
      where: {
        lang: locale1,
      },
    });
    searchStore.setResultsData(results);
    searchStore.setSearchQuery(searchQuery.value);
    emit('search-results', results);
  } catch (error) {
    console.error("Search error:", error);
    searchStore.setResultsData(null);
    emit('search-error', error);
  } finally {
    isSearching.value = false;
    searchStore.setIsSearching(false);
  }
};

const searchWithPill = (pill: string) => {
  // Check if the pill is already in the search query to avoid duplicates
  const currentQuery = searchQuery.value.trim();
  
  // Get the translated term for the current language
  const translatedTerm = t(`pills.${pill}`);
  const queryLower = currentQuery.toLowerCase();
  
  // Don't add if the pill is already in the query
  if (queryLower.includes(translatedTerm.toLowerCase())) {
    return;
  }
  
  // Add the translated pill term to the existing query
  if (currentQuery) {
    searchQuery.value = currentQuery + " " + translatedTerm;
  } else {
    searchQuery.value = translatedTerm;
  }
  
  handleSearch();
};
</script>
