<template>
  <BarChartFilter
    v-if="items.length > 0"
    :title="$t('filters.climateImpacts')"
    icon="i-heroicons-exclamation-triangle"
    filter-key="hazards"
    :items="items"
    :counts="counts"
    :counts-global="countsGlobal"
    :enabled="isEnabled"
    :selection="selection"
    @filter-change="(...args) => emit('filter-change', ...args)"
    @filter-clear="(k) => emit('filter-clear', k)"
    @filter-apply="(...args) => emit('filter-apply', ...args)"
  />
  <div v-else class="text-sm text-gray-500 py-2">{{ $t('filters.empty.hazards') }}</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BarChartFilter from './BarChartFilter.vue';
import type { FacetEntry } from '@/types/facets';

const props = defineProps<{
  enabled?: boolean;
  /** From FilterManager `filters.hazards` */
  selection?: Record<string, boolean> | null;
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

watch(
  () => props.enabled,
  (v) => {
    isEnabled.value = v ?? false
  },
  { immediate: true }
)

const items = computed(() =>
  (props.climateImpacts ?? []).map((e) => ({ key: e.value, label: e.value }))
);
const counts = computed(() => props.forResultSetCounts ?? {});
const countsGlobal = computed(() =>
  Object.fromEntries((props.climateImpacts ?? []).map((e) => [e.value, e.count]))
);
</script>


