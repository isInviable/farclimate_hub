<template>
  <FilterComponent
    :title="$t('filters.time')"
    icon="i-heroicons-clock"
    filter-key="time"
    :has-visualization="false"
    :initial-value="modelValue"
    :enabled="isEnabled"
    @filter-change="handleFilterChange"
    @filter-clear="handleFilterClear"
    @filter-apply="handleFilterApply"
  >
    <template #controls="{ isEnabled }">
      <URadioGroup
        v-model="modelValue"
        orientation="horizontal"
        variant="editorial"
        color="neutral"
        size="sm"
        :items="radioItems"
        @update:model-value="$event => onUpdate($event as string)"
        :disabled="!isEnabled"
      />
    </template>
  </FilterComponent>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FilterComponent from './FilterComponent.vue'

type TimeValue = 'all' | 'last10'

const props = defineProps<{ enabled?: boolean }>()

const emit = defineEmits<{
  'filter-change': [key: string, value: any, enabled: boolean]
  'filter-clear': [key: string]
  'filter-apply': [key: string, value: any]
}>()

const isEnabled = ref(props.enabled || false)
const modelValue = ref<TimeValue>('all')

const { t } = useI18n();

const radioItems = computed(() => [
  { label: t('filters.showAll'), value: 'all' },
  { label: t('timeframes.recent'), value: 'last10' },
]);

function onUpdate(val: string) {
  // Auto-enable when user interacts
  console.log('onUpdate', val)
  if (!isEnabled.value) isEnabled.value = true
  emit('filter-change', 'time', val, true)
}

function handleFilterChange(key: string, value: any, enabled: boolean) {
  isEnabled.value = enabled
  modelValue.value = value as TimeValue
  emit('filter-change', key, value, enabled)
}

function handleFilterClear(key: string) {
  modelValue.value = 'all'
  emit('filter-clear', key)
}

function handleFilterApply(key: string, value: any) {
  emit('filter-apply', key, value)
}
</script>


