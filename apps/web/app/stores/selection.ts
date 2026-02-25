import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface SelectedItem {
  id: string
  title: string
  type: string
  data: any 
}

export const usePinnedSelectionStore = defineStore('selection', () => {
  const selectedItems = ref<SelectedItem[]>([])

  const toggleSelection = (item: SelectedItem) => {
    const index = selectedItems.value.findIndex(i => i.id === item.id)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    } else {
      selectedItems.value.push(item)
    }
  }

  const isSelected = (itemId: string): boolean => {
    return selectedItems.value.some(item => item.id === itemId)
  }

  const clearSelection = () => {
    selectedItems.value = []
  }

  const selectionCount = computed(() => selectedItems.value.length)

  return {
    selectedItems,
    selectionCount,
    toggleSelection,
    isSelected,
    clearSelection,
  }
}) 