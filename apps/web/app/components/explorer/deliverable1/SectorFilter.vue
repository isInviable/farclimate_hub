<template>
  <BarChartFilter
    title="Sector"
    icon="i-heroicons-building-office"
    filter-key="sector"
    :items="sectorItems"
    :counts="sectorCounts"
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

const sectorItems = [
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'forestry', label: 'Forestry' },
  { key: 'fishery', label: 'Fishery' },
];

const sectorCounts: Record<string, number> = {
  Agriculture: 67,
  Forestry: 45,
  Fishery: 32,
};
</script>
