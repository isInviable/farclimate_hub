<template>
  <div
    class="filter-component border-t border-neutral-darkest border-l-2 transition-colors"
    :class="isEnabled ? 'border-l-primary-600 bg-neutral-200' : 'border-l-transparent bg-white'"
  >
    <div
      class="w-full flex items-center gap-2 px-4 py-3 hover:bg-neutral-darkest/3 transition-colors"
    >
      <USwitch
        :model-value="isEnabled"
        size="xs"
        color="primary"
        :aria-label="isEnabled ? `Disable ${title} filter` : `Enable ${title} filter`"
        @click.stop
        @update:model-value="setEnabled"
      />
      <button
        type="button"
        class="flex-1 flex items-center gap-2 text-left min-w-0"
        @click="toggleExpanded"
      >
        <UIcon
          :name="icon"
          class="size-3.5 shrink-0"
          :class="isEnabled ? 'text-primary-600' : 'text-neutral-dark'"
        />
        <span
          class="flex-1 font-mono text-2xs font-bold uppercase tracking-[0.16em] truncate"
          :class="isEnabled ? 'text-neutral-darkest' : 'text-neutral-dark'"
        >
          {{ title }}
        </span>
        <span
          v-if="isEnabled"
          class="inline-flex items-center justify-center min-w-[20px] h-[16px] px-1 bg-neutral-darkest text-neutral-lightest font-mono text-2xs font-bold tabular-nums"
        >
          {{ activeCountLabel }}
        </span>
        <UIcon
          :name="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="size-3.5 text-neutral-dark"
        />
      </button>
    </div>

    <div v-if="isExpanded" class="px-4 pb-4 pt-1">
      <slot name="controls" :value="filterValue" :updateValue="updateFilterValue" :isEnabled="isEnabled">
        <div class="font-mono text-2xs text-neutral-dark">No controls defined</div>
      </slot>

      <div v-if="isEnabled" class="mt-3 flex gap-2">
        <UButton
          size="xs"
          variant="editorial"
          @click="clearFilter"
        >
          Clear
        </UButton>
        <UButton
          v-if="!autoApply"
          size="xs"
          variant="editorial-solid"
          @click="applyFilter"
        >
          Apply
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FilterComponentProps {
  title: string;
  icon: string;
  filterKey: string;
  hasVisualization?: boolean;
  visualizationTitle?: string;
  visualizationPlaceholder?: string;
  visualizationData?: any;
  initialValue?: any;
  enabled?: boolean;
  /** Hide the per-section Apply button (FilterManager already auto-applies on change). */
  autoApply?: boolean;
}

const props = withDefaults(defineProps<FilterComponentProps>(), {
  hasVisualization: false,
  visualizationTitle: 'Visualization',
  visualizationPlaceholder: 'Visualization will appear here',
  visualizationData: null,
  initialValue: null,
  enabled: false,
  autoApply: true,
});

const emit = defineEmits<{
  'filter-change': [key: string, value: any, enabled: boolean];
  'filter-clear': [key: string];
  'filter-apply': [key: string, value: any];
}>();

// Reactive state
const isEnabled = ref(props.enabled);
const isExpanded = ref(true);
const filterValue = ref(props.initialValue);

// Methods
const setEnabled = (val: boolean) => {
  isEnabled.value = val;
  emit('filter-change', props.filterKey, filterValue.value, val);
};

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const updateFilterValue = (newValue: any) => {
  filterValue.value = newValue;
  if (isEnabled.value) {
    emit('filter-change', props.filterKey, newValue, true);
  }
};

const clearFilter = () => {
  filterValue.value = props.initialValue;
  emit('filter-clear', props.filterKey);
};

const applyFilter = () => {
  // Automatically enable the filter when applied
  if (!isEnabled.value) {
    isEnabled.value = true;
    emit('filter-change', props.filterKey, filterValue.value, true);
  }
  emit('filter-apply', props.filterKey, filterValue.value);
};

/** Compact count badge shown next to the title when filter is enabled. */
const activeCountLabel = computed(() => {
  const v = filterValue.value
  if (!v) return '•'
  if (typeof v === 'string') return v.trim() ? '1' : '•'
  if (Array.isArray(v)) return String(v.length)
  if (typeof v === 'object') return String(Object.values(v).filter(Boolean).length)
  return '•'
})

const getFilterStatus = () => {
  if (!filterValue.value) return 'No filter applied';
  
  if (typeof filterValue.value === 'string') {
    return filterValue.value;
  }
  
  if (Array.isArray(filterValue.value)) {
    return `${filterValue.value.length} items selected`;
  }
  
  if (typeof filterValue.value === 'object') {
    const count = Object.values(filterValue.value).filter(Boolean).length;
    return `${count} options selected`;
  }
  
  return 'Filter applied';
};

// Watch for external changes
watch(() => props.enabled, (newVal) => {
  isEnabled.value = newVal;
});

watch(
  () => props.initialValue,
  (newVal) => {
    filterValue.value = newVal
  },
  { deep: true }
)
</script>

