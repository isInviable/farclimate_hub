import { computed, ref, watch, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

export type ExplorerSortKey = 'name' | 'budget'

function sortHits<T extends { id: string; document?: { title?: string; cost_benefit?: string } }>(
  hits: T[],
  key: ExplorerSortKey
): T[] {
  const copy = [...hits]
  if (key === 'name') {
    copy.sort((a, b) =>
      (a.document?.title ?? '').localeCompare(b.document?.title ?? '', undefined, {
        sensitivity: 'base',
      })
    )
  } else {
    copy.sort((a, b) =>
      (a.document?.cost_benefit ?? '').localeCompare(b.document?.cost_benefit ?? '', undefined, {
        sensitivity: 'base',
      })
    )
  }
  return copy
}

export function useExplorerResultsPaging<T extends { id: string; document?: { title?: string; cost_benefit?: string } }>(
  results: MaybeRefOrGetter<T[]>,
  options?: {
    pageSize?: MaybeRefOrGetter<number>
    sortKey?: Ref<ExplorerSortKey>
    totalCount?: MaybeRefOrGetter<number | null | undefined>
    page?: MaybeRefOrGetter<number | null | undefined>
    onPageChange?: (page: number) => void
  }
) {
  const pageSize = computed(() => Math.max(1, Number(toValue(options?.pageSize) ?? 12)))
  const page = ref(1)
  const sortKey = options?.sortKey

  const list = () => toValue(results) ?? []

  const sortedItems = computed(() => {
    const raw = list()
    if (!sortKey) return [...raw]
    return sortHits(raw, sortKey.value)
  })

  const serverTotalCount = computed(() => {
    const n = toValue(options?.totalCount)
    return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, n) : null
  })

  const isServerPaged = computed(() => serverTotalCount.value != null)

  const totalCount = computed(() => serverTotalCount.value ?? sortedItems.value.length)

  const pageCount = computed(() => {
    const n = totalCount.value
    if (n <= 0) return 1
    return Math.ceil(n / pageSize.value)
  })

  const pagedItems = computed(() => {
    const sorted = sortedItems.value
    if (isServerPaged.value) return sorted
    const start = (page.value - 1) * pageSize.value
    return sorted.slice(start, start + pageSize.value)
  })

  const rangeStart = computed(() => {
    if (totalCount.value === 0) return 0
    return (page.value - 1) * pageSize.value + 1
  })

  const rangeEnd = computed(() => {
    if (totalCount.value === 0) return 0
    return Math.min(page.value * pageSize.value, totalCount.value)
  })

  watch(
    () => list().length,
    () => {
      if (isServerPaged.value) return
      page.value = 1
    }
  )

  if (sortKey) {
    watch(sortKey, () => {
      if (isServerPaged.value) return
      page.value = 1
    })
  }

  watch(
    () => toValue(options?.page),
    (value) => {
      if (!isServerPaged.value) return
      if (typeof value === 'number' && Number.isFinite(value)) {
        page.value = Math.max(1, Math.floor(value))
      }
    },
    { immediate: true }
  )

  watch(page, (next, previous) => {
    if (!isServerPaged.value) return
    if (next !== previous) options?.onPageChange?.(next)
  })

  watch([pageCount, page], () => {
    if (page.value > pageCount.value) page.value = Math.max(1, pageCount.value)
    if (page.value < 1) page.value = 1
  })

  return {
    page,
    pageSize,
    totalCount,
    pageCount,
    sortedItems,
    pagedItems,
    rangeStart,
    rangeEnd,
  }
}
