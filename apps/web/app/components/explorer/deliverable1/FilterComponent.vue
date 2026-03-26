<template>
  <div class="filter-component">
    <!-- Filter Header -->
    <div 
      class="filter-header cursor-pointer p-3 rounded-lg border-2 transition-all duration-200"
      :class="[
        isEnabled ? 'border-neutral-400 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300',
        isExpanded ? 'rounded-b-none' : ''
      ]"
      @click="toggleExpanded"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Enable/Disable Toggle -->
          <UButton
            :icon="isEnabled ? 'i-heroicons-check' : 'i-heroicons-plus'"
            :color="isEnabled ? 'neutral' : 'neutral'"
            :variant="isEnabled ? 'solid' : 'outline'"
            size="xs"
            @click.stop="toggleEnabled"
            class="shrink-0"
          />
          
          <!-- Filter Icon -->
          <div class="flex items-center gap-2">
            <UIcon :name="icon" :class="isEnabled ? 'text-neutral-600' : 'text-gray-500'" size="1.2rem" />
            <span class="font-medium text-sm" :class="isEnabled ? 'text-neutral-800' : 'text-gray-700'">
              {{ title }}
            </span>
          </div>
        </div>
        
        <!-- Expand/Collapse Icon -->
        <UIcon 
          :name="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
          class="text-gray-400" 
          size="1rem" 
        />
      </div>
      
      <!-- Filter Status -->
      <div v-if="isEnabled && filterValue" class="mt-2 text-xs text-neutral-600">
        {{ getFilterStatus() }}
      </div>
    </div>

    <!-- Filter Content -->
    <div 
      v-if="isExpanded"
      class="filter-content border-2 border-t-0 rounded-b-lg p-4"
      :class="isEnabled ? 'border-neutral-400 bg-white' : 'border-gray-200 bg-gray-50'"
    >
      <!-- Visualization Area -->
      <div v-if="hasVisualization && isEnabled" class="mb-4">
        <div class="text-xs font-medium text-gray-600 mb-2">{{ visualizationTitle }}</div>
        <div class="visualization-container h-32 bg-white rounded border border-gray-200 p-2">
          <slot name="visualization" :data="visualizationData" :filterValue="filterValue">
            <!-- Default visualization placeholder -->
            <div class="h-full flex items-center justify-center text-gray-400 text-sm">
              {{ visualizationPlaceholder }}
            </div>
          </slot>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="filter-controls">
        <slot name="controls" :value="filterValue" :updateValue="updateFilterValue" :isEnabled="isEnabled">
          <!-- Default filter controls -->
          <div class="text-sm text-gray-500">No controls defined</div>
        </slot>
      </div>

      <!-- Filter Actions -->
      <div v-if="isEnabled" class="mt-4 flex gap-2">
        <UButton
          size="xs"
          variant="outline"
          color="neutral"
          @click="clearFilter"
        >
          Clear
        </UButton>
        <UButton
          size="xs"
          variant="solid"
          color="primary"
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
}

const props = withDefaults(defineProps<FilterComponentProps>(), {
  hasVisualization: false,
  visualizationTitle: 'Visualization',
  visualizationPlaceholder: 'Visualization will appear here',
  visualizationData: null,
  initialValue: null,
  enabled: false
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
const toggleEnabled = () => {
  isEnabled.value = !isEnabled.value;
  emit('filter-change', props.filterKey, filterValue.value, isEnabled.value);
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

<style scoped>
.filter-component {
  margin-bottom: 1rem;
}

.transition-all {
  transition: all 0.2s ease;
}

.bg-primary-25 {
  background-color: rgba(var(--primary-500-rgb), 0.05);
}
</style>
