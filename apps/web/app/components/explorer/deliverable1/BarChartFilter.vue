<template>
  <FilterComponent
    :title="title"
    :icon="icon"
    :filter-key="filterKey"
    :has-visualization="false"
    :initial-value="selectedByKey"
    :enabled="isEnabled"
    @filter-change="handleFilterChange"
    @filter-clear="handleFilterClear"
    @filter-apply="handleFilterApply"
  >
    <template #controls="{ value, isEnabled }">
      <div class="space-y-2">
        <label
          v-for="item in items"
          :key="item.key"
          class="group block rounded-md border px-2 py-2 cursor-pointer transition-all duration-150"
          :class="[
            !isEnabled ? 'opacity-50' : '',
            isSelected(item.key)
              ? 'border-slate-300 bg-slate-50'
              : 'border-transparent hover:border-slate-200 hover:bg-slate-50/70'
          ]"
          @click="toggle(item.key)"
        >
          <div class="mb-1.5 flex items-center justify-between gap-3">
            <span
              class="text-xs ml-0.5 underline-offset-2"
              :class="isSelected(item.key) ? 'text-black font-medium' : 'text-slate-700 group-hover:underline'"
            >
              {{ item.label }}
            </span>

            <span
              class="text-xs font-medium tabular-nums"
              :class="isSelected(item.key) ? 'text-black' : 'text-slate-700'"
            >
              {{ getCurrentCount(item.label) }}{{ hasGlobalCounts ? ` / ${getGlobalCount(item.label)}` : '' }}
            </span>
          </div>

          <!-- Stacked bars: background = total (max), foreground = current result set -->
          <div class="relative h-2 w-full rounded-sm overflow-hidden ">
            <!-- Bar 1: total count (never changes); only when countsGlobal is provided -->
            <div
              v-if="hasGlobalCounts"
              class="absolute left-0 top-0 h-full rounded-sm bg-slate-200"
              :style="{ width: `${getGlobalPercent(item.label)}%` }"
            />
            <!-- Bar 2: current search result count (same scale, overlays) -->
            <div
              class="absolute left-0 top-0 h-full rounded-sm"
              :class="isSelected(item.key) ? 'bg-slate-800' : 'bg-slate-500'"
              :style="{ width: `${getCurrentPercent(item.label)}%` }"
            />
          </div>
        </label>
      </div>
    </template>
  </FilterComponent>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FilterComponent from './FilterComponent.vue';

type Item = { key: string; label: string };

const props = defineProps<{
  title: string;
  icon: string;
  filterKey: string;
  items: Item[];
  /** Current result set counts (what the user is seeing) */
  counts: Record<string, number>;
  /** Total/max counts per facet (never changes). When set, two stacked bars are shown. */
  countsGlobal?: Record<string, number>;
  enabled?: boolean;
}>();

const emit = defineEmits<{
  'filter-change': [key: string, value: any, enabled: boolean];
  'filter-clear': [key: string];
  'filter-apply': [key: string, value: any];
}>();

const isEnabled = ref(props.enabled || false);

// selection state keyed by item.key
const selectedByKey = ref<Record<string, boolean>>(
  Object.fromEntries(props.items.map(i => [i.key, false]))
);

const hasGlobalCounts = computed(() => {
  const g = props.countsGlobal;
  return g && Object.keys(g).length > 0;
});

// Scale for bar widths: use max of global counts when available, else max of current counts
const maxScale = computed(() => {
  if (hasGlobalCounts.value && props.countsGlobal) {
    const values = Object.values(props.countsGlobal);
    return values.length ? Math.max(...values) : 1;
  }
  const values = Object.values(props.counts || {});
  return values.length ? Math.max(...values) : 1;
});

const getGlobalCount = (label: string): number => props.countsGlobal?.[label] ?? 0;
const getCurrentCount = (label: string): number => props.counts?.[label] ?? 0;

const getGlobalPercent = (label: string): number => {
  const c = hasGlobalCounts.value ? getGlobalCount(label) : getCurrentCount(label);
  return maxScale.value ? (c / maxScale.value) * 100 : 0;
};
const getCurrentPercent = (label: string): number => {
  const c = getCurrentCount(label);
  return maxScale.value ? (c / maxScale.value) * 100 : 0;
};

const isSelected = (key: string): boolean => Boolean(selectedByKey.value[key]);

function toggle(key: string) {
  const next = { ...selectedByKey.value, [key]: !selectedByKey.value[key] };
  selectedByKey.value = next;

  if (!isEnabled.value) {
    isEnabled.value = true;
  }
  emit('filter-change', props.filterKey, next, true);
}

function handleFilterChange(key: string, value: any, enabled: boolean) {
  isEnabled.value = enabled;
  emit('filter-change', key, value, enabled);
}

function handleFilterClear(key: string) {
  selectedByKey.value = Object.fromEntries(props.items.map(i => [i.key, false]));
  emit('filter-clear', key);
}

function handleFilterApply(key: string, value: any) {
  emit('filter-apply', key, value);
}
</script>


