import { useSearchStore } from "@/stores/search";

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

  function getLang(): string {
    return locale.value === "es" ? "es" : "en";
  }

  async function search(query: string) {
    if (!query.trim()) return;

    isSearching.value = true;
    error.value = null;
    searchStore.setIsSearching(true);

    try {
      const response = await $fetch<SearchResponse>("/api/search", {
        method: "POST",
        body: { query, lang: getLang(), limit: 30 },
      });

      results.value = response.hits;
      searchStore.setResultsData({
        count: response.count,
        elapsed: { raw: 0, formatted: "0ms" },
        hits: response.hits,
      });
      searchStore.setSearchQuery(query);
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
        body: { query: "", lang: getLang(), limit: 100 },
      });

      results.value = response.hits;
      searchStore.setResultsData({
        count: response.count,
        elapsed: { raw: 0, formatted: "0ms" },
        hits: response.hits,
      });
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
  };
}
