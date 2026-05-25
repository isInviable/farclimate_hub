<template>
  <div class="filter-manager">
    <!-- Active Filters Section -->
    <div v-if="activeFilters.length > 0">
      <div class="flex items-center gap-2 px-4 py-2 border-b">
        <h3 class="flex-1 font-mono text-2xs font-bold uppercase tracking-widest text-neutral-darkest whitespace-nowrap">
          Active Filters
        </h3>
        <span class="inline-flex items-center justify-center min-w-5 h-4 px-1 bg-neutral-darkest text-neutral-lightest font-mono text-2xs font-bold tabular-nums">
          {{ activeFilters.length }}
        </span>
        <SavedSearchMenu
          :filters="filters"
          :enabled-filters="enabledFilters"
          :search-query="searchStore.searchQuery"
          @load-search="handleLoadSavedSearch"
        />
      </div>
      
      <div>
        <!-- Search Filter (Active) -->
        <SearchFilter
          v-if="isFilterEnabled('search')"
          :enabled="true"
          @search-results="handleSearchResults"
          @search-error="handleSearchError"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
          @run-search="handleRunSearch"
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

        <AdaptationApproachesFilter
          v-if="isFilterEnabled('adaptation_approaches')"
          :enabled="true"
          :selection="filters.adaptation_approaches"
          :adaptation-approaches="facetsData?.global?.adaptation_approaches"
          :for-result-set-counts="adaptationApproachesCountsFromResultSet"
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

      </div>
    </div>

    <!-- Available Filters Section -->
    <div v-if="availableFilters.length > 0">
      <div class="flex items-center gap-2 px-4 py-2 border-b border-neutral-darkest bg-neutral-darkest">
        <h3 class="flex-1 font-mono text-2xs font-bold uppercase tracking-widest text-neutral-lightest whitespace-nowrap">
          Available Filters
        </h3>
        <span class="inline-flex items-center justify-center min-w-5 h-4 px-1 bg-neutral-darkest/10 text-neutral-darkest font-mono text-2xs font-bold tabular-nums">
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
      
      <div>
        <!-- Search Filter -->
        <SearchFilter
          v-if="isFilterAvailable('search')"
          :enabled="false"
          @search-results="handleSearchResults"
          @search-error="handleSearchError"
          @filter-change="handleFilterChange"
          @filter-clear="handleFilterClear"
          @filter-apply="handleFilterApply"
          @run-search="handleRunSearch"
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

        <AdaptationApproachesFilter
          v-if="isFilterAvailable('adaptation_approaches')"
          :enabled="false"
          :selection="filters.adaptation_approaches"
          :adaptation-approaches="facetsData?.global?.adaptation_approaches"
          :for-result-set-counts="adaptationApproachesCountsFromResultSet"
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

      </div>
    </div>

    <!-- No Available Filters Message -->
    <div v-else class="text-center py-8 border-t border-neutral-darkest">
      <UIcon name="i-heroicons-check-circle" class="mx-auto mb-2 text-primary-600 size-8" />
      <p class="font-mono text-2xs font-bold uppercase tracking-widest text-neutral-darkest">
        All filters are active
      </p>
      <p class="font-mono text-2xs text-neutral-dark mt-1">
        Remove filters above to make them available again
      </p>
    </div>

    <!-- Filter Actions -->
    <div class="mt-6 pt-4 border-t border-neutral-darkest">
      <div class="flex gap-2">
        <UButton
          variant="editorial"
          size="sm"
          @click="clearAllFilters"
          :disabled="activeFilters.length === 0"
        >
          Clear All
        </UButton>
        <UButton
          variant="editorial-solid"
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
import AdaptationApproachesFilter from './AdaptationApproachesFilter.vue';
import BiogeographicalRegionsFilter from './BiogeographicalRegionsFilter.vue';
import SavedSearchMenu from './SavedSearchMenu.vue';
import {
  facetConstraintSignature,
  stripUnsupportedExplorerFilters,
} from '~/utils/explorerFacetFilters';

// Props
const props = defineProps<{
  searchResults?: any[];
  /** Facets with global corpus totals plus counts for the current result set. */
  facetsData?: FilterFacetsResponse | null;
}>();

// Emits
const emit = defineEmits<{
  'filters-changed': [filters: Record<string, any>];
  'run-search': [filters: Record<string, any>];
  'search-results': [results: any];
  'search-error': [error: any];
}>();

// Reactive state
const filters = reactive<Record<string, any>>({});
const enabledFilters = reactive<Record<string, boolean>>({});
const searchResults = ref(props.searchResults || []);
const lastActiveConstraintSignature = ref(facetConstraintSignature({}));

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
const adaptationApproachesCountsFromResultSet = computed(() => {
  const arr = props.facetsData?.for_result_set?.adaptation_approaches ?? [];
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
  { key: 'adaptation_approaches', title: 'Adaptation approaches', icon: 'i-heroicons-light-bulb' },
  { key: 'biogeographical_regions', title: 'Biogeographical region', icon: 'i-heroicons-map' },
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

/** Emit only enabled, supported filters so parent does not send inactive or legacy keys. */
function getEffectiveFilters() {
  const enabled = Object.fromEntries(
    Object.entries(filters).filter(([k]) => enabledFilters[k])
  );
  return stripUnsupportedExplorerFilters(enabled);
}

function emitFiltersChangedIfConstraintsChanged(force = false) {
  const effective = getEffectiveFilters();
  const nextSignature = facetConstraintSignature(effective);
  if (!force && nextSignature === lastActiveConstraintSignature.value) return;

  lastActiveConstraintSignature.value = nextSignature;
  emit('filters-changed', effective);
}

function clearSearchFilterAndRefetch() {
  delete filters.search;
  enabledFilters.search = false;
  searchStore.setSearchQuery("");
  emitFiltersChangedIfConstraintsChanged(true);
}

/** Mirror `searchStore.searchQuery` into local filter state without emitting (typing updates the store each keystroke; emitting would re-trigger hybrid search). Explorer runs `search()` after URL bootstrap. */
watch(
  () => searchStore.searchQuery,
  (q) => {
    const trimmed = q.trim();
    if (trimmed) {
      filters.search = trimmed;
      enabledFilters.search = true;
    } else {
      delete filters.search;
      enabledFilters.search = false;
    }
  }
);

const handleFilterChange = (key: string, value: any, enabled: boolean) => {
  if (key === "search") {
    if (!enabled) {
      clearSearchFilterAndRefetch();
      return;
    }

    filters.search = typeof value === "string" ? value : searchStore.searchQuery;
    enabledFilters.search = true;
    return;
  }

  filters[key] = value;
  enabledFilters[key] = enabled;
  emitFiltersChangedIfConstraintsChanged();
};

const handleFilterClear = (key: string) => {
  if (key === "search") {
    clearSearchFilterAndRefetch();
    return;
  }

  delete filters[key];
  enabledFilters[key] = false;
  emitFiltersChangedIfConstraintsChanged();
};

const handleFilterApply = (key: string, value: any) => {
  filters[key] = value;
  enabledFilters[key] = true;
  if (key === "search") {
    handleRunSearch();
    return;
  }

  emitFiltersChangedIfConstraintsChanged();
};

const handleRunSearch = () => {
  const query = searchStore.searchQuery.trim();
  if (!query) return;

  filters.search = query;
  enabledFilters.search = true;
  emit('run-search', getEffectiveFilters());
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
  lastActiveConstraintSignature.value = facetConstraintSignature(effective);
  emit('filters-changed', effective);
};

const clearAllFilters = () => {
  Object.keys(filters).forEach(key => {
    delete filters[key];
    enabledFilters[key] = false;
  });
  searchStore.setSearchQuery("");
  lastActiveConstraintSignature.value = facetConstraintSignature({});
  emit('filters-changed', {});
};

const applyAllFilters = () => {
  emitFiltersChangedIfConstraintsChanged();
};
</script>

<style scoped>
.filter-manager {
  min-width: 0;
}
</style>
