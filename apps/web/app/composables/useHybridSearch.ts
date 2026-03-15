import { useSearchStore } from "@/stores/search";
import { fetchFacets } from "@/composables/useFacets";
import type { SearchFacetParams } from "@/types/search";

export interface SearchHit {
  id: string;
  document_uid: string;
  score: number;
  document: Record<string, any>;
}

export interface SearchResponse {
  count: number;
  hits: SearchHit[];
}

export function useHybridSearch() {
  const { locale } = useI18n();
  const searchStore = useSearchStore();

  const results = ref<SearchHit[]>([]);
  const isSearching = ref(false);
  const error = ref<string | null>(null);
  /** Facet filter state sent with search/loadAll. When set, POST /api/search receives sectors, climate_impacts, etc. */
  const facetFilters = ref<SearchFacetParams>({});

  function getLang(): string {
    return locale.value === "es" ? "es" : "en";
  }

  function buildSearchBody(query: string, limit: number) {
    const body: Record<string, unknown> = {
      query: query.trim(),
      lang: getLang(),
      limit,
    };
    if (facetFilters.value.sectors?.length) body.sectors = facetFilters.value.sectors;
    if (facetFilters.value.climate_impacts?.length) body.climate_impacts = facetFilters.value.climate_impacts;
    if (facetFilters.value.adaptation_approaches?.length) body.adaptation_approaches = facetFilters.value.adaptation_approaches;
    if (facetFilters.value.keywords?.length) body.keywords = facetFilters.value.keywords;
    return body;
  }

  async function refetchFacetsAfterSearch(hits: SearchHit[]) {
    try {
      const docIds = hits.map((h) => h.id);
      const facets = await fetchFacets(docIds);
      searchStore.setFacetsData(facets);
    } catch (e) {
      console.warn("[useHybridSearch] fetchFacets after search failed:", e);
      searchStore.setFacetsData(null);
    }
  }

  async function search(query: string) {
    if (!query.trim()) return;

    isSearching.value = true;
    error.value = null;
    searchStore.setIsSearching(true);

    try {
      const response = await $fetch<SearchResponse>("/api/search", {
        method: "POST",
        body: buildSearchBody(query, 30),
      });

      results.value = response.hits;
      searchStore.setResultsData({
        count: response.count,
        elapsed: { raw: 0, formatted: "0ms" },
        hits: response.hits,
      });
      searchStore.setSearchQuery(query);
      await refetchFacetsAfterSearch(response.hits);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      error.value = message;
      console.error("[useHybridSearch] search error:", err);
    } finally {
      isSearching.value = false;
      searchStore.setIsSearching(false);
    }
  }

  async function loadAll() {
    isSearching.value = true;
    error.value = null;
    searchStore.setIsSearching(true);

    try {
      const response = await $fetch<SearchResponse>("/api/search", {
        method: "POST",
        body: buildSearchBody("", 100),
      });

      results.value = response.hits;
      searchStore.setResultsData({
        count: response.count,
        elapsed: { raw: 0, formatted: "0ms" },
        hits: response.hits,
      });
      await refetchFacetsAfterSearch(response.hits);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load documents";
      error.value = message;
      console.error("[useHybridSearch] loadAll error:", err);
    } finally {
      isSearching.value = false;
      searchStore.setIsSearching(false);
    }
  }

  return {
    search,
    loadAll,
    results,
    isSearching,
    error,
    facetFilters,
  };
}
