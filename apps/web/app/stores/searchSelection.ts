import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface SearchSelectedItem {
  id: string
  title: string
  document: any
}

export const useSearchSelectionStore = defineStore('searchSelection', () => {
  const selected = ref<SearchSelectedItem[]>([])

  const toggle = (item: SearchSelectedItem) => {
    const idx = selected.value.findIndex(i => i.id === item.id)
    if (idx > -1) selected.value.splice(idx, 1)
    else selected.value.push(item)
  }

  const clear = () => { selected.value = [] }
  /** Replaces the entire selection (legacy / bulk replace). */
  const selectAll = (items: SearchSelectedItem[]) => { selected.value = [...items] }

  /** Adds any items not already selected (e.g. select-all on current page). */
  const mergeAdd = (items: SearchSelectedItem[]) => {
    for (const item of items) {
      if (!selected.value.some(s => s.id === item.id)) selected.value.push({ ...item })
    }
  }

  /** Removes only the given ids; leaves other selections unchanged. */
  const removeByIds = (ids: string[]) => {
    if (ids.length === 0) return
    const drop = new Set(ids)
    selected.value = selected.value.filter(s => !drop.has(s.id))
  }

  const isSelected = (id: string) => selected.value.some(i => i.id === id)
  /** True when every item in `items` is selected (typical: current page slice). */
  const isAllSelected = (items: SearchSelectedItem[]) =>
    items.length > 0 && items.every(i => selected.value.some(s => s.id === i.id))
  const count = computed(() => selected.value.length)

  return {
    selected,
    toggle,
    clear,
    isSelected,
    selectAll,
    mergeAdd,
    removeByIds,
    count,
    isAllSelected,
  };
})


