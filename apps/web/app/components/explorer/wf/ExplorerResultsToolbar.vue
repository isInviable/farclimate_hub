<template>
  <div class="flex flex-wrap justify-between items-center gap-4">
    <div class="flex flex-wrap items-end gap-3 min-w-0">
      <slot name="leading" />
      <UFormField
        v-if="showSort"
        :label="$t('common.sortBy')"
        class="w-48 min-w-40 shrink-0"
      >
        <USelectMenu
          v-model="sortKey"
          :items="sortMenuItems"
          value-key="value"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="flex flex-wrap items-center gap-3 justify-end">
      <UButton
        v-if="showBulkSelect"
        variant="outline"
        size="sm"
        class="shrink-0"
        @click="$emit('bulk-toggle')"
      >
        {{
          allOnPageSelected
            ? $t('viewModes.unselectOnPage')
            : $t('viewModes.selectAllOnPage')
        }}
      </UButton>

      <div class="flex flex-wrap items-center gap-2">
        <UPagination
          v-if="showPagination && totalCount > 0 && hasMultiplePages"
          v-model:page="page"
          :items-per-page="pageSize"
          :total="totalCount"
          :max="maxPaginationButtons"
        />
        <span
          class="text-sm text-neutral-600 tabular-nums whitespace-nowrap"
          role="status"
        >
          {{ summaryText }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ExplorerSortKey } from '@/composables/useExplorerResultsPaging'

const props = withDefaults(
  defineProps<{
    totalCount: number
    rangeStart: number
    rangeEnd: number
    pageSize: number
    showPagination?: boolean
    showSort?: boolean
    showBulkSelect?: boolean
    allOnPageSelected?: boolean
    maxPaginationButtons?: number
  }>(),
  {
    showPagination: true,
    showSort: false,
    showBulkSelect: false,
    allOnPageSelected: false,
    maxPaginationButtons: 7,
  }
)

const page = defineModel<number>('page', { required: true })

const sortKey = defineModel<ExplorerSortKey>('sortKey', { required: false, default: 'name' })

defineEmits<{
  'bulk-toggle': []
}>()

const { t } = useI18n()

const sortMenuItems = computed(() => [
  { label: t('common.name'), value: 'name' as const },
  { label: t('common.budget'), value: 'budget' as const },
])

/** More than one page of results (pagination UI hidden when false). */
const hasMultiplePages = computed(() => {
  const ps = props.pageSize
  if (ps <= 0) return false
  return props.totalCount > ps
})

const summaryText = computed(() => {
  const c = props.totalCount
  if (c === 0) return t('viewModes.resultsTotal', { count: 0 })
  const singlePage = !props.showPagination || !hasMultiplePages.value
  if (singlePage) return t('viewModes.resultsTotal', { count: c })
  return t('viewModes.resultsRange', {
    start: props.rangeStart,
    end: props.rangeEnd,
    total: c,
  })
})
</script>
