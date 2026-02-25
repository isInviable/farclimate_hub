import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useProjectsStore } from '@/stores/projects'

export interface PinnedItem {
  id: string
  title: string
  type: 'result' | 'contact' | 'image' | 'website' | 'other'
  data: any
  notes?: string
  timestamp: number
}

export const usePinsStore = defineStore('pins', () => {
  const pinnedItems = ref<PinnedItem[]>([])
  
  const pinItem = (item: Omit<PinnedItem, 'timestamp'>) => {
    const newPin: PinnedItem = {
      ...item,
      timestamp: Date.now()
    }
    pinnedItems.value.push(newPin)
    // Persist into current project
    try { useProjectsStore().saveCurrentProjectPins() } catch (_) {}
    return newPin.id
  }

  const unpinItem = (id: string) => {
    const index = pinnedItems.value.findIndex(pin => pin.id === id)
    if (index !== -1) {
      pinnedItems.value.splice(index, 1)
    }
    try { useProjectsStore().saveCurrentProjectPins() } catch (_) {}
  }

  const isPinned = (id: string) => {
    return pinnedItems.value.some(pin => pin.id === id)
  }

  const getPinnedItems = () => pinnedItems.value

  const updatePinNotes = (id: string, notes: string) => {
    const pin = pinnedItems.value.find(p => p.id === id)
    if (pin) {
      pin.notes = notes
    }
    try { useProjectsStore().saveCurrentProjectPins() } catch (_) {}
  }

  const updatePin = (id: string, patch: Partial<PinnedItem>) => {
    const index = pinnedItems.value.findIndex(p => p.id === id)
    if (index !== -1) {
      pinnedItems.value[index] = { ...pinnedItems.value[index], ...patch }
    }
    try { useProjectsStore().saveCurrentProjectPins() } catch (_) {}
  }

  const clearAllPins = () => {
    pinnedItems.value = []
    try { useProjectsStore().saveCurrentProjectPins() } catch (_) {}
  }

  const setPinnedItems = (items: PinnedItem[]) => {
    pinnedItems.value = items
    try { useProjectsStore().saveCurrentProjectPins() } catch (_) {}
  }

  return {
    pinnedItems,
    pinItem,
    unpinItem,
    isPinned,
    getPinnedItems,
    updatePinNotes,
    updatePin,
    clearAllPins,
    setPinnedItems
  }
}) 