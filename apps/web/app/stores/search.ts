import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SearchResult } from '@/types/search'

export const useSearchStore = defineStore('search', () => {
  const selectedTags = ref<{
    keywords: string[]
    adaptation_approaches: string[]
    climate_impacts: string[]
  }>({
    keywords: [],
    adaptation_approaches: [],
    climate_impacts: []
  })

  const searchQuery = ref('')
  const isSearching = ref(false)
  const resultsData = ref<{
    count: number
    elapsed: {
      raw: number
      formatted: string
    }
    hits: {
      document: SearchResult
      id: string
      score: number
    }[]
  } | null>(null)

  const hasAnySelectedTags = computed(() => {
    return selectedTags.value.keywords.length > 0 || 
           selectedTags.value.adaptation_approaches.length > 0 || 
           selectedTags.value.climate_impacts.length > 0
  })

  const setSelectedTags = (tags: {
    keywords: string[]
    adaptation_approaches: string[]
    climate_impacts: string[]
  }) => {
    selectedTags.value = tags
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const setResultsData = (data: typeof resultsData.value) => {
    resultsData.value = data
  }

  const setIsSearching = (value: boolean) => {
    isSearching.value = value
  }

  return {
    selectedTags,
    searchQuery,
    hasAnySelectedTags,
    isSearching,
    resultsData,
    setSelectedTags,
    setSearchQuery,
    setResultsData,
    setIsSearching
  }
}) 