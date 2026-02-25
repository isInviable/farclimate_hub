<template>
  <BarChartFilter
    title="Hazards"
    icon="i-heroicons-exclamation-triangle"
    filter-key="hazards"
    :items="hazardItems"
    :counts="hazardCounts"
    :enabled="isEnabled"
    @filter-change="(...args) => emit('filter-change', ...args)"
    @filter-clear="(k) => emit('filter-clear', k)"
    @filter-apply="(...args) => emit('filter-apply', ...args)"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BarChartFilter from './BarChartFilter.vue';

const props = defineProps<{ enabled?: boolean }>();
const emit = defineEmits<{
  'filter-change': [key: string, value: any, enabled: boolean];
  'filter-clear': [key: string];
  'filter-apply': [key: string, value: any];
}>();

const isEnabled = ref(props.enabled || false);

const hazardItems = [
  { key: 'drought', label: 'Drought' },
  { key: 'flooding', label: 'Flooding' },
  { key: 'extremeTemp', label: 'Extreme Temperature' },
  { key: 'storms', label: 'Storms' },
];

const hazardCounts: Record<string, number> = {
  Drought: 28,
  Flooding: 42,
  'Extreme Temperature': 15,
  Storms: 23,
};
</script>


