<template>
  <div
    class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-t border-b border-neutral-darkest bg-neutral-lightest"
  >
    <slot name="leading" />

    <!-- Sort -->
    <div v-if="showSort" class="flex items-center gap-2">
      <span class="font-mono uppercase text-2xs tracking-[0.14em] text-neutral-dark">
        {{ $t('common.sortBy') }}
      </span>
      <div class="relative">
        <select
          v-model="sortKey"
          class="appearance-none border border-neutral-darkest bg-neutral-lightest text-neutral-darkest font-mono text-xs leading-none pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-darkest cursor-pointer"
        >
          <option v-for="opt in sortMenuItems" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <UIcon
          name="i-heroicons-chevron-down-20-solid"
          class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-darkest"
        />
      </div>
    </div>

    <div class="flex-1" />

    <!-- Bulk select -->
    <button
      v-if="showBulkSelect"
      type="button"
      class="inline-flex items-center h-8 px-3 border border-neutral-darkest bg-transparent text-neutral-darkest hover:bg-neutral-darkest/5 transition-colors font-mono uppercase text-2xs font-bold tracking-[0.12em]"
      @click="$emit('bulk-toggle')"
    >
      {{
        allOnPageSelected
          ? $t('viewModes.unselectOnPage')
          : $t('viewModes.selectAllOnPage')
      }}
    </button>

    <!-- Pagination -->
    <div
      v-if="showPagination && totalCount > 0 && hasMultiplePages"
      class="flex items-center"
      role="navigation"
      aria-label="Pagination"
    >
      <button
        type="button"
        :disabled="page <= 1"
        class="w-8 h-8 border border-neutral-darkest bg-transparent text-neutral-darkest font-mono text-sm font-bold leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-darkest/5 transition-colors"
        :aria-label="$t('common.firstPage', 'First page')"
        @click="goTo(1)"
      >
        «
      </button>
      <button
        type="button"
        :disabled="page <= 1"
        class="w-8 h-8 -ml-px border border-neutral-darkest bg-transparent text-neutral-darkest font-mono text-sm font-bold leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-darkest/5 transition-colors"
        :aria-label="$t('common.previousPage', 'Previous page')"
        @click="goTo(page - 1)"
      >
        ‹
      </button>
      <button
        v-for="p in visiblePages"
        :key="p"
        type="button"
        :aria-current="p === page ? 'page' : undefined"
        :class="[
          'w-8 h-8 -ml-px border border-neutral-darkest font-mono text-xs font-bold leading-none transition-colors',
          p === page
            ? 'bg-neutral-darkest text-neutral-lightest'
            : 'bg-transparent text-neutral-darkest hover:bg-neutral-darkest/5',
        ]"
        @click="goTo(p)"
      >
        {{ p }}
      </button>
      <button
        type="button"
        :disabled="page >= pageCount"
        class="w-8 h-8 -ml-px border border-neutral-darkest bg-transparent text-neutral-darkest font-mono text-sm font-bold leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-darkest/5 transition-colors"
        :aria-label="$t('common.nextPage', 'Next page')"
        @click="goTo(page + 1)"
      >
        ›
      </button>
      <button
        type="button"
        :disabled="page >= pageCount"
        class="w-8 h-8 -ml-px border border-neutral-darkest bg-transparent text-neutral-darkest font-mono text-sm font-bold leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-darkest/5 transition-colors"
        :aria-label="$t('common.lastPage', 'Last page')"
        @click="goTo(pageCount)"
      >
        »
      </button>
    </div>

    <span
      class="font-mono uppercase text-2xs tracking-[0.12em] text-neutral-dark tabular-nums whitespace-nowrap"
      role="status"
    >
      {{ summaryText }}
    </span>
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

const pageCount = computed(() => {
  if (props.pageSize <= 0) return 1
  return Math.max(1, Math.ceil(props.totalCount / props.pageSize))
})

const hasMultiplePages = computed(() => pageCount.value > 1)

/** Window of page numbers around the current page, capped by maxPaginationButtons. */
const visiblePages = computed<number[]>(() => {
  const max = Math.max(1, props.maxPaginationButtons)
  const total = pageCount.value
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1)
  const half = Math.floor(max / 2)
  let start = Math.max(1, page.value - half)
  const end = Math.min(total, start + max - 1)
  start = Math.max(1, end - max + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

function goTo(p: number) {
  const next = Math.min(pageCount.value, Math.max(1, p))
  if (next !== page.value) page.value = next
}

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
