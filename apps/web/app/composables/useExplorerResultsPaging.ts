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
    pageSize?: number
    sortKey?: Ref<ExplorerSortKey>
  }
) {
  const pageSize = ref(options?.pageSize ?? 12)
  const page = ref(1)
  const sortKey = options?.sortKey

  const list = () => toValue(results) ?? []

  const sortedItems = computed(() => {
    const raw = list()
    if (!sortKey) return [...raw]
    return sortHits(raw, sortKey.value)
  })

  const totalCount = computed(() => sortedItems.value.length)

  const pageCount = computed(() => {
    const n = totalCount.value
    if (n <= 0) return 1
    return Math.ceil(n / pageSize.value)
  })

  const pagedItems = computed(() => {
    const sorted = sortedItems.value
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
      page.value = 1
    }
  )

  if (sortKey) {
    watch(sortKey, () => {
      page.value = 1
    })
  }

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
