<template>
  <SearchFilter
    v-if="filterKey === 'search'"
    :enabled="enabled"
    @search-results="(r) => emit('search-results', r)"
    @search-error="(e) => emit('search-error', e)"
    @filter-change="(...args) => emit('filter-change', ...args)"
    @filter-clear="(k) => emit('filter-clear', k)"
    @filter-apply="(...args) => emit('filter-apply', ...args)"
    @run-search="() => emit('run-search')"
  />

  <SectorFilter
    v-else-if="filterKey === 'sector'"
    :enabled="enabled"
    :selection="filters.sector"
    :sectors="facetsData?.global?.sectors"
    :for-result-set-counts="sectorCountsFromResultSet"
    @filter-change="(...args) => emit('filter-change', ...args)"
    @filter-clear="(k) => emit('filter-clear', k)"
    @filter-apply="(...args) => emit('filter-apply', ...args)"
  />

  <HazardsFilter
    v-else-if="filterKey === 'hazards'"
    :enabled="enabled"
    :selection="filters.hazards"
    :climate-impacts="facetsData?.global?.climate_impacts"
    :for-result-set-counts="climateImpactsCountsFromResultSet"
    @filter-change="(...args) => emit('filter-change', ...args)"
    @filter-clear="(k) => emit('filter-clear', k)"
    @filter-apply="(...args) => emit('filter-apply', ...args)"
  />

  <AdaptationApproachesFilter
    v-else-if="filterKey === 'adaptation_approaches'"
    :enabled="enabled"
    :selection="filters.adaptation_approaches"
    :adaptation-approaches="facetsData?.global?.adaptation_approaches"
    :for-result-set-counts="adaptationApproachesCountsFromResultSet"
    @filter-change="(...args) => emit('filter-change', ...args)"
    @filter-clear="(k) => emit('filter-clear', k)"
    @filter-apply="(...args) => emit('filter-apply', ...args)"
  />

  <BiogeographicalRegionsFilter
    v-else-if="filterKey === 'biogeographical_regions'"
    :enabled="enabled"
    :selection="filters.biogeographical_regions"
    :biogeographical-regions="facetsData?.global?.biogeographical_regions"
    :for-result-set-counts="biogeographicalRegionsCountsFromResultSet"
    @filter-change="(...args) => emit('filter-change', ...args)"
    @filter-clear="(k) => emit('filter-clear', k)"
    @filter-apply="(...args) => emit('filter-apply', ...args)"
  />
</template>

<script setup lang="ts">
import type { FilterFacetsResponse } from '@/types/facets';
import SearchFilter from './SearchFilter.vue';
import SectorFilter from './SectorFilter.vue';
import HazardsFilter from './HazardsFilter.vue';
import AdaptationApproachesFilter from './AdaptationApproachesFilter.vue';
import BiogeographicalRegionsFilter from './BiogeographicalRegionsFilter.vue';

defineProps<{
  filterKey: string;
  enabled: boolean;
  filters: Record<string, unknown>;
  facetsData?: FilterFacetsResponse | null;
  sectorCountsFromResultSet: Record<string, number>;
  climateImpactsCountsFromResultSet: Record<string, number>;
  biogeographicalRegionsCountsFromResultSet: Record<string, number>;
  adaptationApproachesCountsFromResultSet: Record<string, number>;
}>();

const emit = defineEmits<{
  'filter-change': [key: string, value: unknown, enabled: boolean];
  'filter-clear': [key: string];
  'filter-apply': [key: string, value: unknown];
  'search-results': [results: unknown];
  'search-error': [error: unknown];
  'run-search': [];
}>();
</script>
