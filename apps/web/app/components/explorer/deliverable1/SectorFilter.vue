<template>
  <BarChartFilter
    v-if="items.length > 0"
    :title="$t('filters.sector')"
    icon="i-heroicons-building-office"
    filter-key="sector"
    :items="items"
    :counts="counts"
    :counts-global="countsGlobal"
    :enabled="isEnabled"
    :selection="selection"
    @filter-change="(...args) => emit('filter-change', ...args)"
    @filter-clear="(k) => emit('filter-clear', k)"
    @filter-apply="(...args) => emit('filter-apply', ...args)"
  />
  <div v-else class="text-sm text-gray-500 py-2">{{ $t('filters.empty.sector') }}</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BarChartFilter from './BarChartFilter.vue';
import type { FacetEntry } from '@/types/facets';

const props = defineProps<{
  enabled?: boolean;
  /** From FilterManager `filters.sector` (saved-search restore, etc.) */
  selection?: Record<string, boolean> | null;
  /** From facets API: global.sectors */
  sectors?: FacetEntry[];
  /** From facets API: for_result_set.sectors (value -> count) */
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
  (props.sectors ?? []).map((e) => ({ key: e.value, label: e.value }))
);
const counts = computed(() => props.forResultSetCounts ?? {});
const countsGlobal = computed(() =>
  Object.fromEntries((props.sectors ?? []).map((e) => [e.value, e.count]))
);
</script>
