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
      <div class="flex flex-col">
        <label
          v-for="item in items"
          :key="item.key"
          class="group flex flex-col gap-1.5 py-2 cursor-pointer select-none transition-colors"
          :class="[
            !isEnabled ? 'opacity-50' : '',
            isSelected(item.key)
              ? 'text-neutral-darkest'
              : 'text-neutral-darker hover:text-neutral-darkest',
          ]"
          @click="toggle(item.key)"
        >
          <div class="flex items-center gap-2.5">
            <span
              class="inline-flex shrink-0 items-center justify-center w-3 h-3 border border-neutral-darkest transition-colors"
              :class="isSelected(item.key) ? 'bg-primary-600' : 'bg-transparent group-hover:bg-neutral-darkest/5'"
              aria-hidden="true"
            />
            <span
              class="font-mono text-xs flex-1 truncate"
              :class="isSelected(item.key) ? 'font-semibold' : 'font-normal'"
            >
              {{ item.label }}
            </span>
            <span class="font-mono text-2xs text-neutral-dark tabular-nums whitespace-nowrap">
              {{ getCurrentCount(item.label)
              }}<span v-if="hasGlobalCounts" class="opacity-60"
                >/{{ getGlobalCount(item.label) }}</span
              >
            </span>
          </div>

          <div class="relative h-[3px] w-full overflow-hidden bg-neutral-darkest/8">
            <div
              v-if="hasGlobalCounts"
              class="absolute left-0 top-0 h-full bg-neutral-darkest/15"
              :style="{ width: `${getGlobalPercent(item.label)}%` }"
            />
            <div
              class="absolute left-0 top-0 h-full transition-colors"
              :class="isSelected(item.key) ? 'bg-primary-600' : 'bg-neutral-darkest'"
              :style="{ width: `${getCurrentPercent(item.label)}%` }"
            />
          </div>
        </label>
      </div>
    </template>
  </FilterComponent>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import FilterComponent from './FilterComponent.vue';

type Item = { key: string; label: string };

const props = defineProps<{
  title: string;
  icon: string;
  filterKey: string;
  items: Item[];
  /** Current result set counts keyed by facet value */
  counts: Record<string, number>;
  /** Corpus-wide counts keyed by facet value */
  countsGlobal?: Record<string, number>;
  enabled?: boolean;
  /**
   * Selection map from parent FilterManager (e.g. after saved-search load).
   * Keys are item.key; keeps UI in sync with `filters[filterKey]`.
   */
  selection?: Record<string, boolean> | null;
}>();

const emit = defineEmits<{
  'filter-change': [key: string, value: any, enabled: boolean];
  'filter-clear': [key: string];
  'filter-apply': [key: string, value: any];
}>();

const isEnabled = ref(props.enabled || false);

watch(
  () => props.enabled,
  (v) => {
    isEnabled.value = Boolean(v)
  },
  { immediate: true }
)

// selection state keyed by item.key
const selectedByKey = ref<Record<string, boolean>>(
  Object.fromEntries(props.items.map(i => [i.key, false]))
);

function rebuildSelectionFromProps() {
  const base = Object.fromEntries(
    props.items.map((i) => [i.key, false])
  ) as Record<string, boolean>
  const sel = props.selection
  if (sel && typeof sel === 'object' && !Array.isArray(sel)) {
    for (const i of props.items) {
      if (Object.prototype.hasOwnProperty.call(sel, i.key)) {
        base[i.key] = Boolean(sel[i.key])
      }
    }
  }
  selectedByKey.value = base
}

watch(
  () => [props.items, props.selection] as const,
  () => rebuildSelectionFromProps(),
  { deep: true, immediate: true }
)

const hasGlobalCounts = computed(() => {
  const g = props.countsGlobal;
  return g && Object.keys(g).length > 0;
});

// Scale bar widths against the largest corpus-wide count when available.
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


