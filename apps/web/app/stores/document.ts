import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SearchResult } from '@/types/search'

export const useDocumentStore = defineStore('document', () => {
  const selectedDocument = ref<SearchResult | null>(null)
  const isSidePanelOpen = ref(false)
  const documentSummary = ref<string[] | null>(null)
  const isSummaryLoading = ref(false)

  const setSelectedDocument = (document: SearchResult | null) => {
    selectedDocument.value = document
  }

  const setIsSidePanelOpen = (value: boolean) => {
    isSidePanelOpen.value = value
  }

  const setDocumentSummary = (summary: string[] | null) => {
    documentSummary.value = summary
  }

  const setIsSummaryLoading = (value: boolean) => {
    isSummaryLoading.value = value
  }

  return {
    selectedDocument,
    isSidePanelOpen,
    documentSummary,
    isSummaryLoading,
    setSelectedDocument,
    setIsSidePanelOpen,
    setDocumentSummary,
    setIsSummaryLoading
  }
}) 