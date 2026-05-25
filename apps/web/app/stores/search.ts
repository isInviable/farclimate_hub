import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { ArticleDetail } from '@/types/search'
import type { ExplorerCorpusMetadataResponse, FacetCategory, FilterFacetsResponse } from '@/types/facets'
import type { ExplorerEffectiveFilters } from '@/types/explorerFilters'
import type { ExplorerSearchHit } from '@/types/explorerSearch'

function emptyFacetCategory(): FacetCategory {
  return {
    sectors: [],
    climate_impacts: [],
    adaptation_approaches: [],
    keywords: [],
    biogeographical_regions: [],
  }
}

export const useSearchStore = defineStore('search', () => {
  const facetsData = ref<FilterFacetsResponse | null>(null)
  const corpusMetadata = ref<ExplorerCorpusMetadataResponse | null>(null)
  const explorerSearchSignature = ref<string | null>(null)
  const explorerSearchTotal = ref<number | null>(null)
  const explorerSearchLimit = ref(60)
  const explorerSearchOffset = ref(0)
  const explorerLoadedPages = ref<Record<number, ExplorerSearchHit[]>>({})

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
    hits: ExplorerSearchHit[]
  } | null>(null)

  const explorerAccumulatedHits = computed(() => {
    const seen = new Set<string>()
    return Object.entries(explorerLoadedPages.value)
      .sort(([a], [b]) => Number(a) - Number(b))
      .flatMap(([, hits]) => hits)
      .filter((hit) => {
        if (seen.has(hit.id)) return false
        seen.add(hit.id)
        return true
      })
  })

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

  const resetExplorerSearchCache = (signature: string | null = null) => {
    explorerSearchSignature.value = signature
    explorerSearchTotal.value = null
    explorerSearchOffset.value = 0
    explorerLoadedPages.value = {}
  }

  const setExplorerSearchPage = (payload: {
    signature: string
    offset: number
    limit: number
    hits: ExplorerSearchHit[]
    total?: number
    facets?: FilterFacetsResponse
  }) => {
    if (explorerSearchSignature.value !== payload.signature) {
      resetExplorerSearchCache(payload.signature)
    }

    explorerSearchLimit.value = payload.limit
    explorerSearchOffset.value = payload.offset
    explorerLoadedPages.value = {
      ...explorerLoadedPages.value,
      [payload.offset]: payload.hits,
    }

    if (typeof payload.total === 'number') {
      explorerSearchTotal.value = payload.total
    }
    if (payload.facets) {
      facetsData.value = payload.facets
    }

    resultsData.value = {
      count: explorerSearchTotal.value ?? payload.hits.length,
      elapsed: { raw: 0, formatted: '0ms' },
      hits: payload.hits,
    }
  }

  const setFacetsData = (data: FilterFacetsResponse | null) => {
    facetsData.value = data
  }

  const setCorpusMetadata = (data: ExplorerCorpusMetadataResponse | null) => {
    corpusMetadata.value = data
    facetsData.value = data
      ? { global: data.globalFacets, for_result_set: emptyFacetCategory() }
      : null
  }

  const setIsSearching = (value: boolean) => {
    isSearching.value = value
  }

  return {
    facetsData,
    corpusMetadata,
    explorerSearchSignature,
    explorerSearchTotal,
    explorerSearchLimit,
    explorerSearchOffset,
    explorerLoadedPages,
    explorerAccumulatedHits,
    explorerEffectiveFilters,
    selectedTags,
    searchQuery,
    hasAnySelectedTags,
    isSearching,
    resultsData,
    setFacetsData,
    setCorpusMetadata,
    setExplorerEffectiveFilters,
    setSelectedTags,
    setSearchQuery,
    setResultsData,
    resetExplorerSearchCache,
    setExplorerSearchPage,
    setIsSearching,
  }
})
