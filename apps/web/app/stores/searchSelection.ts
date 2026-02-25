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
  const selectAll = (items: SearchSelectedItem[]) => { selected.value = items }
  const isSelected = (id: string) => selected.value.some(i => i.id === id)
  const isAllSelected = (items: SearchSelectedItem[]) => selected.value.length === items.length
  const count = computed(() => selected.value.length)

  return {
    selected,
    toggle,
    clear,
    isSelected,
    selectAll,
    count,
    isAllSelected,
  };
})


