<template>
  <div class="filter-manager">
    <!-- Active Filters Section -->
    <div v-if="activeFilters.length > 0" class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <UIcon name="i-heroicons-funnel" class="text-primary-600" size="1.2rem" />
        <h3 class="font-semibold text-gray-800">Active Filters</h3>
        <span class="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
          {{ activeFilters.length }}
        </span>
        <SavedSearchMenu
          :filters="filters"
          :enabled-filters="enabledFilters"
          :search-query="searchStore.searchQuery"
          @load-search="handleLoadSavedSearch"
        />
      </div>
      
      <div class="space-y-4">
        <!-- Search Filter (Active) -->
        <SearchFilter
          v-if="isFilterEnabled('search')"
          :enabled="true"
          @search-results="handleSearchResults"
          @search-error="handleSearchError"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
        />

        <!-- Sector Filter (Active) -->
        <SectorFilter
          v-if="isFilterEnabled('sector')"
          :enabled="true"
          :selection="filters.sector"
          :sectors="facetsData?.global?.sectors"
          :for-result-set-counts="sectorCountsFromResultSet"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
        />

        <HazardsFilter
          v-if="isFilterEnabled('hazards')"
          :enabled="true"
          :selection="filters.hazards"
          :climate-impacts="facetsData?.global?.climate_impacts"
          :for-result-set-counts="climateImpactsCountsFromResultSet"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
        />

        <TimeFilter
          v-if="isFilterEnabled('time')"
          :enabled="true"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
        />

        <BiogeographicalRegionsFilter
          v-if="isFilterEnabled('biogeographical_regions')"
          :enabled="true"
          :selection="filters.biogeographical_regions"
          :biogeographical-regions="facetsData?.global?.biogeographical_regions"
          :for-result-set-counts="biogeographicalRegionsCountsFromResultSet"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
        />

        <!-- Add more active filters here -->
        <!-- <HazardFilter v-if="isFilterEnabled('hazards')" :enabled="true" />
        <PhaseFilter v-if="isFilterEnabled('phases')" :enabled="true" />
        <ScaleFilter v-if="isFilterEnabled('scales')" :enabled="true" /> -->
      </div>
    </div>

    <!-- Available Filters Section -->
    <div v-if="availableFilters.length > 0">
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-heroicons-adjustments-horizontal" class="text-gray-600" size="1.2rem" />
        <h3 class="font-semibold text-gray-800">Available Filters</h3>
        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {{ availableFilters.length }}
        </span>
        <SavedSearchMenu
          v-if="activeFilters.length === 0"
          :filters="filters"
          :enabled-filters="enabledFilters"
          :search-query="searchStore.searchQuery"
          @load-search="handleLoadSavedSearch"
        />
      </div>
      
      <div class="space-y-4">
        <!-- Search Filter -->
        <SearchFilter
          v-if="isFilterAvailable('search')"
          :enabled="false"
          @search-results="handleSearchResults"
          @search-error="handleSearchError"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
        />

        <!-- Sector Filter -->
        <SectorFilter
          v-if="isFilterAvailable('sector')"
          :enabled="false"
          :selection="filters.sector"
          :sectors="facetsData?.global?.sectors"
          :for-result-set-counts="sectorCountsFromResultSet"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
        />

        <HazardsFilter
          v-if="isFilterAvailable('hazards')"
          :enabled="false"
          :selection="filters.hazards"
          :climate-impacts="facetsData?.global?.climate_impacts"
          :for-result-set-counts="climateImpactsCountsFromResultSet"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
        />

        <TimeFilter
          v-if="isFilterAvailable('time')"
          :enabled="false"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
        />

        <BiogeographicalRegionsFilter
          v-if="isFilterAvailable('biogeographical_regions')"
          :enabled="false"
          :selection="filters.biogeographical_regions"
          :biogeographical-regions="facetsData?.global?.biogeographical_regions"
          :for-result-set-counts="biogeographicalRegionsCountsFromResultSet"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
        />

        <!-- Add more filters here -->
        <!-- <HazardFilter v-if="isFilterAvailable('hazards')" :enabled="false" />
        <PhaseFilter v-if="isFilterAvailable('phases')" :enabled="false" />
        <ScaleFilter v-if="isFilterAvailable('scales')" :enabled="false" /> -->
      </div>
    </div>

    <!-- No Available Filters Message -->
    <div v-else class="text-center py-8 text-gray-500">
      <UIcon name="i-heroicons-check-circle" size="2rem" class="mx-auto mb-2 text-green-500" />
      <p class="text-sm">All filters are active</p>
      <p class="text-xs">Remove filters above to make them available again</p>
    </div>

    <!-- Filter Actions -->
    <div class="mt-6 pt-4 border-t border-gray-200">
      <div class="flex gap-2">
        <UButton
          variant="outline"
          color="neutral"
          size="sm"
          @click="clearAllFilters"
          :disabled="activeFilters.length === 0"
        >
          Clear All
        </UButton>
        <UButton
          variant="solid"
          color="primary"
          size="sm"
          @click="applyAllFilters"
          :disabled="activeFilters.length === 0"
        >
          Apply Filters
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from "vue";
import { useSearchStore } from '@/stores/search';
import { useProjectsStore } from '@/stores/projects';
import type { FilterFacetsResponse } from '@/types/facets';
import type { SavedSearchFilters } from "~/types/savedSearches";
import { applySavedSearchFiltersState } from "~/utils/applySavedSearchFilters";
import { tryConsumePendingSavedSearchApply } from "~/utils/pendingSavedSearchExplorer";
import { useSavedSearchExplorerApplySignal } from "~/composables/useSavedSearchExplorerApplySignal";
import SearchFilter from './SearchFilter.vue';
import SectorFilter from './SectorFilter.vue';
import HazardsFilter from './HazardsFilter.vue';
import TimeFilter from './TimeFilter.vue';
import BiogeographicalRegionsFilter from './BiogeographicalRegionsFilter.vue';
import SavedSearchMenu from './SavedSearchMenu.vue';

// Props
const props = defineProps<{
  searchResults?: any[];
  /** Facets with global corpus totals plus counts for the current result set. */
  facetsData?: FilterFacetsResponse | null;
}>();

// Emits
const emit = defineEmits<{
  'filters-changed': [filters: Record<string, any>];
  'search-results': [results: any];
  'search-error': [error: any];
}>();

// Reactive state
const filters = reactive<Record<string, any>>({});
const enabledFilters = reactive<Record<string, boolean>>({});
const searchResults = ref(props.searchResults || []);

// Derive current result-set counts as Record<value, count> for BarChartFilter.
const sectorCountsFromResultSet = computed(() => {
  const arr = props.facetsData?.for_result_set?.sectors ?? [];
  return Object.fromEntries(arr.map((e) => [e.value, e.count]));
});
const climateImpactsCountsFromResultSet = computed(() => {
  const arr = props.facetsData?.for_result_set?.climate_impacts ?? [];
  return Object.fromEntries(arr.map((e) => [e.value, e.count]));
});
const biogeographicalRegionsCountsFromResultSet = computed(() => {
  const arr = props.facetsData?.for_result_set?.biogeographical_regions ?? [];
  return Object.fromEntries(arr.map((e) => [e.value, e.count]));
});

// Initialize search filter if there's already a search query
const searchStore = useSearchStore();
const projectsStore = useProjectsStore();
const { tick: savedSearchApplyTick } = useSavedSearchExplorerApplySignal();

function consumePendingSavedSearchIfAny() {
  const pid = projectsStore.currentProjectId;
  if (!pid) return;
  const pending = tryConsumePendingSavedSearchApply(pid);
  if (!pending) return;
  void nextTick(() => {
    handleLoadSavedSearch(pending);
  });
}

watch(
  () => projectsStore.currentProjectId,
  () => {
    consumePendingSavedSearchIfAny();
  },
  { immediate: true }
);

watch(savedSearchApplyTick, () => {
  consumePendingSavedSearchIfAny();
});

// Check if there's an existing search query and enable search filter
if (searchStore.searchQuery && searchStore.searchQuery.trim()) {
  filters.search = searchStore.searchQuery;
  enabledFilters.search = true;
}

// Filter metadata: show biogeographical_regions only when the API returns that category (after DB migration)
const allFilterMetadata = [
  { key: 'search', title: 'Search', icon: 'i-heroicons-magnifying-glass' },
  { key: 'sector', title: 'Sector', icon: 'i-heroicons-building-office' },
  { key: 'hazards', title: 'Climate Hazards', icon: 'i-heroicons-exclamation-triangle' },
  { key: 'biogeographical_regions', title: 'Biogeographical region', icon: 'i-heroicons-map' },
  { key: 'phases', title: 'Implementation Phase', icon: 'i-heroicons-clock' },
  { key: 'scales', title: 'Geographic Scale', icon: 'i-heroicons-map' },
  { key: 'time', title: 'Time', icon: 'i-heroicons-clock' },
];
const filterMetadata = computed(() => {
  const hasBiogeographicalRegions = props.facetsData?.global?.biogeographical_regions !== undefined;
  return hasBiogeographicalRegions
    ? allFilterMetadata
    : allFilterMetadata.filter((m) => m.key !== 'biogeographical_regions');
});

// Computed
const activeFilters = computed(() => {
  return filterMetadata.value
    .filter(meta => enabledFilters[meta.key])
    .map(meta => ({
      ...meta,
      status: getFilterStatus(meta.key)
    }));
});

const availableFilters = computed(() => {
  return filterMetadata.value
    .filter(meta => !enabledFilters[meta.key]);
});

// Methods
const isFilterEnabled = (key: string): boolean => {
  return enabledFilters[key] || false;
};

const isFilterAvailable = (key: string): boolean => {
  return !enabledFilters[key];
};

const getFilterStatus = (key: string): string => {
  const value = filters[key];
  if (!value) return 'No filter applied';
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (Array.isArray(value)) {
    return `${value.length} items selected`;
  }
  
  if (typeof value === 'object') {
    const count = Object.values(value).filter(Boolean).length;
    return `${count} options selected`;
  }
  
  return 'Filter applied';
};

/** Emit only filters that are currently enabled, so parent does not send inactive filter values in the query/facets. */
function getEffectiveFilters() {
  return Object.fromEntries(
    Object.entries(filters).filter(([k]) => enabledFilters[k])
  );
}

const handleFilterChange = (key: string, value: any, enabled: boolean) => {
  filters[key] = value;
  enabledFilters[key] = enabled;
  emit('filters-changed', getEffectiveFilters());
};

const handleFilterClear = (key: string) => {
  delete filters[key];
  enabledFilters[key] = false;
  emit('filters-changed', getEffectiveFilters());
};

const handleFilterApply = (key: string, value: any) => {
  filters[key] = value;
  enabledFilters[key] = true;
  emit('filters-changed', getEffectiveFilters());
};

const handleSearchResults = (results: any) => {
  searchResults.value = results.hits || [];
  emit('search-results', results);
};

const handleSearchError = (error: any) => {
  emit('search-error', error);
};

const handleLoadSavedSearch = (state: SavedSearchFilters) => {
  const effective = applySavedSearchFiltersState(state, {
    filters,
    enabledFilters,
    setSearchQuery: (q) => searchStore.setSearchQuery(q),
  });
  emit('filters-changed', effective);
};

const clearAllFilters = () => {
  Object.keys(filters).forEach(key => {
    delete filters[key];
    enabledFilters[key] = false;
  });
  emit('filters-changed', {});
};

const applyAllFilters = () => {
  emit('filters-changed', getEffectiveFilters());
};
</script>

<style scoped>
.filter-manager {
  min-width: 0;
}
</style>
