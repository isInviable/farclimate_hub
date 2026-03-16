<template>
  <BarChartFilter
    v-if="items.length > 0"
    title="Biogeographical region"
    icon="i-heroicons-map"
    filter-key="biogeographical_regions"
    :items="items"
    :counts="counts"
    :counts-global="countsGlobal"
    :enabled="isEnabled"
    @filter-change="(...args) => emit('filter-change', ...args)"
    @filter-clear="(k) => emit('filter-clear', k)"
    @filter-apply="(...args) => emit('filter-apply', ...args)"
  />
  <div v-else class="text-sm text-gray-500 py-2">No biogeographical region data yet. Run a search or load all.</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BarChartFilter from './BarChartFilter.vue';
import type { FacetEntry } from '@/types/facets';

const props = defineProps<{
  enabled?: boolean;
  /** From facets API: global.biogeographical_regions */
  biogeographicalRegions?: FacetEntry[];
  /** From facets API: for_result_set.biogeographical_regions (value -> count) */
  forResultSetCounts?: Record<string, number>;
}>();
const emit = defineEmits<{
  'filter-change': [key: string, value: any, enabled: boolean];
  'filter-clear': [key: string];
  'filter-apply': [key: string, value: any];
}>();

const isEnabled = ref(props.enabled ?? false);

const items = computed(() =>
  (props.biogeographicalRegions ?? []).map((e) => ({ key: e.value, label: e.value }))
);
const counts = computed(() => props.forResultSetCounts ?? {});
const countsGlobal = computed(() =>
  Object.fromEntries((props.biogeographicalRegions ?? []).map((e) => [e.value, e.count]))
);
</script>
