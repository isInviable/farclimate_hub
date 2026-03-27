import type { ArticleDetail } from '@/types/search'
import type { FilterFacetsResponse } from '@/types/facets'
import type { ExplorerEffectiveFilters } from '@/types/explorerFilters'

export const useSearchStore = defineStore('search', () => {
  const facetsData = ref<FilterFacetsResponse | null>(null)

  /** Last effective sidebar filters (JSON-serializable); mirrors `FilterManager` emit payload. */
  const explorerEffectiveFilters = ref<ExplorerEffectiveFilters>({})

  const setExplorerEffectiveFilters = (payload: ExplorerEffectiveFilters) => {
    explorerEffectiveFilters.value = JSON.parse(JSON.stringify(payload)) as ExplorerEffectiveFilters
  }

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
      document: ArticleDetail
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

  const setFacetsData = (data: FilterFacetsResponse | null) => {
    facetsData.value = data
  }

  const setIsSearching = (value: boolean) => {
    isSearching.value = value
  }

  return {
    facetsData,
    explorerEffectiveFilters,
    selectedTags,
    searchQuery,
    hasAnySelectedTags,
    isSearching,
    resultsData,
    setFacetsData,
    setExplorerEffectiveFilters,
    setSelectedTags,
    setSearchQuery,
    setResultsData,
    setIsSearching,
  }
})
