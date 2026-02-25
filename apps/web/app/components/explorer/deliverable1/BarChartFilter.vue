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
      <div class="space-y-3">
        <label
          v-for="item in items"
          :key="item.key"
          class="relative flex items-center gap-3 py-1 rounded cursor-pointer overflow-hidden"
          :class="{ 'opacity-50': !isEnabled }"
          @click="toggle(item.key)"
        >
          <div
            class="absolute left-0 inset-y-0 rounded-r"
            :class="isSelected(item.key) ? 'bg-slate-800' : 'bg-slate-300'"
            :style="{ width: `${getPercent(item.label)}%` }"
          ></div>

          <span
            class="relative z-10 text-xs ml-3"
            :class="isSelected(item.key) ? 'text-slate-100' : 'text-slate-700'"
          >
            {{ item.label }}
          </span>

          <span
            class="ml-auto text-xs font-medium relative z-10 mr-2"
            :class="isSelected(item.key) ? 'text-slate-100' : 'text-slate-600'"
          >
            {{ getCount(item.label) }}
          </span>
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
  counts: Record<string, number>;
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

const maxCount = computed(() => {
  const values = Object.values(props.counts || {});
  return values.length ? Math.max(...values) : 1;
});

const getCount = (label: string): number => props.counts?.[label] ?? 0;
const getPercent = (label: string): number => {
  const c = props.counts?.[label] ?? 0;
  return maxCount.value ? (c / maxCount.value) * 100 : 0;
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


