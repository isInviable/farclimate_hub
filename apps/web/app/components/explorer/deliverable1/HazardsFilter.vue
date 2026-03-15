<template>
  <BarChartFilter
    v-if="items.length > 0"
    title="Climate impacts"
    icon="i-heroicons-exclamation-triangle"
    filter-key="hazards"
    :items="items"
    :counts="counts"
    :counts-global="countsGlobal"
    :enabled="isEnabled"
    @filter-change="(...args) => emit('filter-change', ...args)"
    @filter-clear="(k) => emit('filter-clear', k)"
    @filter-apply="(...args) => emit('filter-apply', ...args)"
  />
  <div v-else class="text-sm text-gray-500 py-2">No climate impact data yet. Run a search or load all.</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BarChartFilter from './BarChartFilter.vue';
import type { FacetEntry } from '@/types/facets';

const props = defineProps<{
  enabled?: boolean;
  /** From facets API: global.climate_impacts */
  climateImpacts?: FacetEntry[];
  /** From facets API: for_result_set.climate_impacts (value -> count) */
  forResultSetCounts?: Record<string, number>;
}>();
const emit = defineEmits<{
  'filter-change': [key: string, value: any, enabled: boolean];
  'filter-clear': [key: string];
  'filter-apply': [key: string, value: any];
}>();

const isEnabled = ref(props.enabled ?? false);

const items = computed(() =>
  (props.climateImpacts ?? []).map((e) => ({ key: e.value, label: e.value }))
);
const counts = computed(() => props.forResultSetCounts ?? {});
/** Total counts per climate impact (for the "max" bar); never changes. */
const countsGlobal = computed(() =>
  Object.fromEntries((props.climateImpacts ?? []).map((e) => [e.value, e.count]))
);
</script>


