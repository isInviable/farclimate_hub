import { useSearchStore } from "@/stores/search";
import type { ArticleDetail, SearchFacetParams } from "@/types/search";
import type { ExplorerSearchResponse, ExplorerSearchHit } from "@/types/explorerSearch";
import { knowledgeApiLang } from "@/utils/knowledgeApiLang";

export interface SearchHit {
  id: string;
  document_uid: string;
  score: number;
  document: ArticleDetail;
}

export interface SearchResponse {
  count: number;
  hits: SearchHit[];
}

const DEFAULT_LIMIT = 30;
const DEFAULT_CANDIDATE_COUNT = 400;

export function useHybridSearch() {
  const { locale } = useI18n();
  const searchStore = useSearchStore();

  const results = ref<ExplorerSearchHit[]>([]);
  const isSearching = ref(false);
  const error = ref<string | null>(null);
  /** Facet filter state sent with search/loadAll. When set, POST /api/search receives sectors, climate_impacts, etc. */
  const facetFilters = ref<SearchFacetParams>({});
  const activeQuery = ref("");

  function getLang(): string {
    return knowledgeApiLang(locale.value);
  }

  function sortedUnique(values: string[] | undefined): string[] {
    return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  }

  function buildSignature(query: string) {
    const filters = {
      sectors: sortedUnique(facetFilters.value.sectors),
      climate_impacts: sortedUnique(facetFilters.value.climate_impacts),
      adaptation_approaches: sortedUnique(facetFilters.value.adaptation_approaches),
      keywords: sortedUnique(facetFilters.value.keywords),
      biogeographical_regions: sortedUnique(facetFilters.value.biogeographical_regions),
    };
    return JSON.stringify({
      query: query.trim(),
      lang: getLang(),
      mode: "hybrid",
      candidate_count: DEFAULT_CANDIDATE_COUNT,
      full_text_weight: 2,
      semantic_weight: 1,
      rrf_k: 50,
      match_threshold: 0,
      min_score: 0.02,
      filters,
    });
  }

  function buildSearchBody(query: string, limit: number, offset = 0, includeFacets = true) {
    const body: Record<string, unknown> = {
      query: query.trim(),
      lang: getLang(),
      limit,
      offset,
      includeFacets,
      candidate_count: DEFAULT_CANDIDATE_COUNT,
    };
    if (facetFilters.value.sectors?.length) body.sectors = facetFilters.value.sectors;
    if (facetFilters.value.climate_impacts?.length) body.climate_impacts = facetFilters.value.climate_impacts;
    if (facetFilters.value.adaptation_approaches?.length) body.adaptation_approaches = facetFilters.value.adaptation_approaches;
    if (facetFilters.value.keywords?.length) body.keywords = facetFilters.value.keywords;
    if (facetFilters.value.biogeographical_regions?.length) body.biogeographical_regions = facetFilters.value.biogeographical_regions;
    return body;
  }

  async function runExplorerSearch(query: string, options: { offset?: number; includeFacets?: boolean } = {}) {
    isSearching.value = true;
    error.value = null;
    searchStore.setIsSearching(true);

    try {
      const offset = options.offset ?? 0;
      const expectedSignature = buildSignature(query);
      const includeFacets =
        options.includeFacets ??
        (searchStore.explorerSearchSignature !== expectedSignature ||
          searchStore.explorerSearchTotal == null);

      const response = await $fetch<ExplorerSearchResponse>("/api/explorer-search", {
        method: "POST",
        body: buildSearchBody(query, DEFAULT_LIMIT, offset, includeFacets),
      });

      results.value = response.hits;
      searchStore.setExplorerSearchPage({
        signature: response.signature,
        offset: response.offset,
        limit: response.limit,
        hits: response.hits,
        total: response.total,
        facets: response.facets,
      });
      searchStore.setSearchQuery(query);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      error.value = message;
      console.error("[useHybridSearch] explorer search error:", err);
    } finally {
      isSearching.value = false;
      searchStore.setIsSearching(false);
    }
  }

  async function search(query: string) {
    if (!query.trim()) return;
    activeQuery.value = query.trim();
    await runExplorerSearch(activeQuery.value, { offset: 0, includeFacets: true });
  }

  async function loadAll() {
    activeQuery.value = "";
    await runExplorerSearch("", { offset: 0, includeFacets: true });
  }

  async function loadPage(page: number, pageSize = DEFAULT_LIMIT) {
    const safePage = Math.max(1, Math.floor(page));
    const offset = (safePage - 1) * pageSize;
    const cached = searchStore.explorerLoadedPages[offset];
    if (cached) {
      results.value = cached;
      searchStore.setResultsData({
        count: searchStore.explorerSearchTotal ?? cached.length,
        elapsed: { raw: 0, formatted: "0ms" },
        hits: cached,
      });
      return;
    }
    await runExplorerSearch(activeQuery.value, { offset, includeFacets: false });
  }

  return {
    search,
    loadAll,
    loadPage,
    results,
    isSearching,
    error,
    facetFilters,
  };
}
