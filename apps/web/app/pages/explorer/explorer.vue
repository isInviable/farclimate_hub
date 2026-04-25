<template>
  <div class="min-h-screen  bg-neutral-lightest px-8">
    <!-- Global Header -->
    <DeliverableHeader />
    <div class="grid grid-cols-12 gap-4">
      <!-- Left Sidebar - Filters (20%) -->
      <aside class="col-span-3 bg-transparent border-r border-gray-200 p-6">
        <div class="sticky top-8">
          <!-- Results Counter -->
          <div class="flex items-center mb-6">
            <div class="bg-black border border-black px-2 py-1 text-xs font-mono">
              <span class="text-white">
                Showing <span class="font-medium">{{ filteredPapers.length }}</span>
                of <span class="font-medium">{{ corpusTotalCount }}</span>
                case studies
              </span>
            </div>
          </div>

          <!-- Filter Manager -->
          <FilterManager
            :search-results="searchStore.resultsData?.hits || []"
            :facets-data="searchStore.facetsData"
            @filters-changed="handleFiltersChanged"
            @search-results="handleSearchResults"
            @search-error="handleSearchError"
          />
        </div>
      </aside>

      <!-- Main Content Area (80%) -->
      <main class="col-span-9">
        <!-- View Switcher -->
        <div class="mb-6">
          

          <!-- View Options -->
          <div class="grid grid-cols-3 gap-2">
            <div class="col-span-2 flex gap-3">
              <!-- top menu -->
              <UButton
                variant="soft"
                color="neutral"
                :class="viewMode === 'list' ? 'opacity-100' : 'opacity-40'"
                @click="setViewMode('list')"
                icon="mdi:view-list"
                size="sm"
              >
                list
              </UButton>
              <UButton
                variant="soft"
                color="neutral"
                :class="viewMode === 'map' ? 'opacity-100' : 'opacity-40'"
                @click="setViewMode('map')"
                icon="mdi:map-outline"
              >
                map
              </UButton>

              <UButton
                variant="soft"
                color="neutral"
                :class="viewMode === 'bubble' ? 'opacity-100' : 'opacity-40'"
                @click="setViewMode('bubble')"
                icon="mdi:chart-bubble"
                size="sm"
              >
                by bioRegions
              </UButton>

              <UButton
                variant="soft"
                color="neutral"
                :class="viewMode === 'grid' ? 'opacity-100' : 'opacity-40'"
                @click="setViewMode('grid')"
                icon="mdi:view-grid"
                size="sm"
              >
                Compare
              </UButton>

              <UButton
                variant="soft"
                color="neutral"
                :class="viewMode === 'instagram' ? 'opacity-100' : 'opacity-40'"
                @click="setViewMode('instagram')"
                icon="mdi:instagram"
                size="sm"
              >
                images
              </UButton>
            </div>
          </div>
        </div>

        <!-- Results Display -->
        <div class="rounded-md min-h-[600px]">
          <!-- List View -->
          <ViewModeListSimple
            v-if="viewMode === 'list'"
            :results="filteredPapers"
            :isSearching="isSearching"
            @document-selected="handleDocumentSelected"
          />

          <!-- Grid View -->
          <ViewModeGrid
            v-else-if="viewMode === 'grid'"
            :results="filteredPapers"
            @document-selected="handleDocumentSelected"
          />

          <!-- Instagram View -->
          <ViewModeInstagram
            v-else-if="viewMode === 'instagram'"
            :results="filteredPapers"
            @document-selected="handleDocumentSelected"
          />

          <!-- Map View -->
          <ViewModeMap
            v-else-if="viewMode === 'map'"
            :results="filteredPapers"
            @document-selected="handleDocumentSelected"
          />

          <!-- Bubble View (biogeographical regions / UMAP) -->
          <ViewModeBioregionUmap
            v-else-if="viewMode === 'bubble'"
            :results="filteredPapers"
            @document-selected="handleDocumentSelected"
          />

          <!-- Gantt View -->
          <div v-else-if="viewMode === 'gantt'" class="p-6">
            <h3 class="text-lg font-semibold mb-4">Gantt Chart View</h3>
            <div
              class="bg-gray-100 h-96 rounded-lg flex items-center justify-center"
            >
              <p class="text-gray-500">
                Gantt chart visualization will be displayed here
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>

  <!-- Article Side Panel -->
    <ArticleSidePanel
      :open="isSidePanelOpen"
      v-if="selectedDocument!=null"
      :document="selectedDocument"
      @close="handlePanelClose"
    />


  <ActionBarExplorer
    context="explorer"
    @open-chat="handleOpenChat"
    @open-insights="handleOpenInsights"
    @open-mindmap="handleOpenMindmap"
  />

  <!-- Fullscreen Modals -->
  <UModal v-model:open="isChatOpen" fullscreen>
    <template #body>
      <div class="max-w-5xl mx-auto">
        <ViewModeChat :hits="searchStore.resultsData?.hits || []" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="isInsightsOpen" fullscreen>
    <template #body>
      <div class="max-w-5xl mx-auto">
        <ViewModeSummaries
          :hits="searchStore.resultsData?.hits || []"
          :searchQuery="searchQuery"
          :selectedTags="searchStore.selectedTags"
          @article-click="handleArticleClick"
        />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="isMindmapOpen" fullscreen>
    <template #body>
      <div class="max-w-6xl mx-auto py-6 px-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Mind map</h2>
          <div class="flex items-center gap-2">
            <UButton size="sm" variant="soft" @click="generateMindmap" :loading="isMindmapLoading">
              Regenerate
            </UButton>
            <UButton size="sm" variant="outline" @click="isMindmapOpen = false">Close</UButton>
          </div>
        </div>
        <div class="bg-white rounded-md border border-gray-200 h-[70vh] p-0 overflow-hidden">
          <div v-if="isMindmapLoading" class="w-full h-full flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin h-8 w-8 text-gray-500" />
          </div>
          <div v-else class="w-full h-full">
            <div class="w-full h-full min-h-[400px]">
              <ClientOnly>
              <MarkmapViewer :markdown="mindmapMarkdown" @article-click="handleArticleClick" />
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { useSearchStore } from "@/stores/search";
import type { ExplorerEffectiveFilters } from "@/types/explorerFilters";
import { useSearchSelectionStore } from "@/stores/searchSelection";
import { useHybridSearch } from "@/composables/useHybridSearch";
import { fetchCorpusMetadata } from "@/composables/useFacets";
import type { ArticleDetail } from "@/types/search";

// i18n composable for language detection
const { locale } = useI18n();


// Page metadata
definePageMeta({
  title: "Climate Adaptation Explorer",
  description:
    "Explore climate adaptation papers and solutions with interactive filters and multiple view modes.",
  layout: 'explorer'
});

// SEO head
useHead({
  title: "Climate Adaptation Explorer - Deliverable 1",
  meta: [
    {
      name: "description",
      content:
        "Explore climate adaptation papers and solutions with interactive filters and multiple view modes.",
    },
  ],
});

// Props
const props = defineProps({
  title: {
    type: String,
    default: "Climate Adaptation Explorer",
  },
});

// Reactive state
const viewMode = ref("list");
const searchStore = useSearchStore();
const route = useRoute();
const router = useRouter();
const { search: hybridSearch, loadAll, isSearching: _hybridSearching, facetFilters } = useHybridSearch();

function getDocumentUidFromQuery(
  q: typeof route.query
): string | null {
  const raw = q.document ?? q.uid ?? q.document_uid;
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.trim() ? first.trim() : null;
  }
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return null;
}

function stripDocumentQueryFromUrl() {
  const newQuery = { ...route.query };
  delete newQuery.document;
  delete newQuery.uid;
  delete newQuery.document_uid;
  return router.replace({ path: route.path, query: newQuery });
}

const documentDeepLinkBusy = ref(false);

/** Open side panel from `?document=` / `?uid=` / `?document_uid=` (pins, shared links). */
async function openDocumentFromQueryParam(uid: string) {
  if (documentDeepLinkBusy.value) return;
  if (
    selectedDocument.value?.document_uid === uid &&
    isSidePanelOpen.value
  ) {
    return;
  }
  documentDeepLinkBusy.value = true;
  try {
    const hits = searchStore.resultsData?.hits || [];
    const hit = hits.find(
      (h: { document?: { document_uid?: string }; document_uid?: string }) =>
        h.document?.document_uid === uid || h.document_uid === uid
    );
    if (hit?.document) {
      handleDocumentSelected(hit.document as ArticleDetail);
      await stripDocumentQueryFromUrl();
    } else {
      const lang = locale.value === "es" ? "es" : "en";
      const res = await $fetch<{ document: ArticleDetail }>("/api/document-by-uid", {
        query: { uid, lang },
      });
      if (res?.document) {
        handleDocumentSelected(res.document);
        await stripDocumentQueryFromUrl();
      }
    }
  } catch (e) {
    console.warn("[explorer] document deep link failed", e);
  } finally {
    documentDeepLinkBusy.value = false;
  }
}

const selectedDocument = ref<ArticleDetail | null>(null);
const isSidePanelOpen = ref(false);
const isChatOpen = ref(false);
const isInsightsOpen = ref(false);
const isMindmapOpen = ref(false);
const isMindmapLoading = ref(false);
const mindmapMarkdown = ref<string>(`# markmap\n\n## Loading...`);
const selection = useSearchSelectionStore();

// Map demo data for bubble view (from solutionsNakedAlt)
const dummyData = ref<any[]>([]);
// const uniqueBiogeographicalRegions = ref<string[]>([]);
const selectedBlock = ref<string>('none');
const displayTitle = ref<string>('');

// Use search query and search state from store
const searchQuery = computed({
  get: () => searchStore.searchQuery,
  set: (value) => searchStore.setSearchQuery(value),
});

const isSearching = computed(() => searchStore.isSearching);
const corpusTotalCount = computed(() => searchStore.corpusMetadata?.totalCount ?? 0);

// Methods
const setViewMode = (mode: string) => {
  viewMode.value = mode;
};

// Filter handling methods
const handleFiltersChanged = (filters: Record<string, any>) => {
  searchStore.setExplorerEffectiveFilters(filters as ExplorerEffectiveFilters);
  // Sync facet params and re-run search so API returns filtered results
  const sectorSel = filters.sector;
  const sectors = typeof sectorSel === "object" && sectorSel !== null
    ? Object.entries(sectorSel).filter(([, v]) => v).map(([k]) => k)
    : [];
  const hazardsSel = filters.hazards;
  const climate_impacts = typeof hazardsSel === "object" && hazardsSel !== null
    ? Object.entries(hazardsSel).filter(([, v]) => v).map(([k]) => k)
    : [];
  const regionsSel = filters.biogeographical_regions;
  const biogeographical_regions = typeof regionsSel === "object" && regionsSel !== null && !Array.isArray(regionsSel)
    ? Object.entries(regionsSel).filter(([, v]) => v).map(([k]) => k)
    : Array.isArray(regionsSel) ? regionsSel.filter((v): v is string => typeof v === "string") : [];
  if (facetFilters) {
    facetFilters.value = { sectors, climate_impacts, adaptation_approaches: [], keywords: [], biogeographical_regions };
  }
  if (searchStore.searchQuery.trim()) {
    hybridSearch(searchStore.searchQuery);
  } else {
    loadAll();
  }
};

const handleSearchResults = (results: any) => {
  // Handle search results from FilterManager
  console.log("Search results received:", results);
};

const handleSearchError = (error: any) => {
  // Handle search errors from FilterManager
  console.error("Search error:", error);
};

const handleArticleClick = (articleId: string) => {
  const hit = searchStore.resultsData?.hits.find((hit) => hit.id === articleId);
  console.log("Article clicked:", articleId);
  console.log("Hit:", hit);
  if (hit?.document) {
    handleDocumentSelected(hit.document as ArticleDetail);
  }
};

async function search() {
  if (!searchQuery.value.trim()) return;
  await hybridSearch(searchQuery.value);
}

async function loadAllArticles() {
  await loadAll();
}

async function loadCorpusMetadata() {
  try {
    const metadata = await fetchCorpusMetadata();
    searchStore.setCorpusMetadata(metadata);
  } catch (e) {
    console.warn("[explorer] failed to load corpus metadata", e);
  }
}

// Document selection handlers
const handleDocumentSelected = (document: ArticleDetail) => {
  console.log("handleDocumentSelected", document);
  selectedDocument.value = document;
  isSidePanelOpen.value = true;
};

const handlePanelClose = () => {
  selectedDocument.value = null;
  isSidePanelOpen.value = false;
};

function handleOpenChat() {
  console.log("[explorer] open chat clicked");
  isChatOpen.value = true;
}

function handleOpenInsights() {
  console.log("[explorer] open insights clicked");
  isInsightsOpen.value = true;
}

async function handleOpenMindmap() {
  isMindmapOpen.value = true;
  await generateMindmap();
}

async function generateMindmap() {
  try {
    isMindmapLoading.value = true;
    mindmapMarkdown.value = `# markmap\n\n## Generating...`;
    const documents = (searchStore.resultsData?.hits || []).slice(0, 20).map((h: any) => {
      const text = [h.document?.title, h.document?.summary, h.document?.content]
        .filter(Boolean)
        .join("\n\n");
      return `articleId: ${h.id}\n${text}`;
    });
    const res = await $fetch('/api/generateMindmap', {
      method: 'POST',
      body: {
        documents,
      }
    });
    mindmapMarkdown.value = (res as any)?.markdown || `# markmap\n\n## No data`;
  } catch (e) {
    console.error('Failed to generate mindmap', e);
    mindmapMarkdown.value = `# markmap\n\n## Failed to generate mindmap`;
  } finally {
    isMindmapLoading.value = false;
  }
}

function toggleBlock(block: string) {
  selectedBlock.value = selectedBlock.value === block ? 'none' : block;
}

// Computed filtered papers (now using search results and active filters)
const filteredPapers = computed(() => {
  const searchResults = searchStore.resultsData?.hits || [];

  return searchResults.filter((paper: any) => {
    const doc = paper.document || paper;
    const activeFilters = searchStore.explorerEffectiveFilters;

    const sectorFilter = activeFilters.sector;
    const docSectors = Array.isArray(doc.sectors) ? doc.sectors : doc.sectors ? [doc.sectors] : [];
    const sectorMatch =
      !sectorFilter ||
      Object.entries(sectorFilter).some(
        ([sector, selected]) =>
          selected && docSectors.some((s: string) => s.toLowerCase().includes(sector.toLowerCase()))
      );

    const hazardsFilter = activeFilters.hazards;
    const docHazards = doc.climate_impacts || [];
    const hazardMatch =
      !hazardsFilter ||
      Object.entries(hazardsFilter).some(
        ([hazard, selected]) =>
          selected &&
          docHazards.some((h: string) => h.toLowerCase().includes(hazard.toLowerCase()))
      );

    const phasesFilter = activeFilters.phases;
    const phaseMatch =
      !phasesFilter ||
      Object.entries(phasesFilter).some(
        ([phase, selected]) => selected && doc.phase?.toLowerCase() === phase
      );

    const scalesFilter = activeFilters.scales;
    const scaleMatch =
      !scalesFilter ||
      Object.entries(scalesFilter).some(
        ([scale, selected]) => selected && doc.scale?.toLowerCase() === scale
      );

    return sectorMatch && hazardMatch && phaseMatch && scaleMatch;
  });
});

// Lifecycle
onMounted(async () => {
  await loadCorpusMetadata();

  // Check for URL parameters
  const typeParam = route.query.type;
  if (typeParam) {
    const searchTerm = Array.isArray(typeParam) ? typeParam[0] : typeParam;
    if (searchTerm) {
      searchQuery.value = searchTerm;
      await search();
    }
  } else {
    await loadAllArticles();
  }

  const docUid = getDocumentUidFromQuery(route.query);
  if (docUid) {
    await openDocumentFromQueryParam(docUid);
  }

  // Fetch demo map data similar to solutionsNakedAlt
//   fetch('/sampledata/combined_data.json')
//     .then(r => r.json())
//     .then((all) => {
//       const onlyEn = (all || []).filter((d: any) => d.lang === 'en');
//       dummyData.value = onlyEn.map((d: any, i: number) => {
//         const raw = d.geographic_characterisation?.biogeographical_regions || '';
//         const regions = raw.split(',').map((r: string) => r.trim());
//         if (!regions[0]) regions[0] = 'none';
//         return {
//           lat: d.location ? d.location.lat : 0,
//           lng: d.location ? d.location.lon : 0,
//           group: i % 3,
//           regions,
//           title: d.title || 'No title',
//           subtitle: d.subtitle || 'No subtitle',
//           sectors: d.sectors || [],
//           adaptation_approaches: d.adaptation_approaches || [],
//           climate_impacts: d.climate_impacts || [],
//           implementation_years: d.implementation_years || {},
//           keywords: d.keywords || []
//         }
//       });

//       const biog = dummyData.value
//         .map((d: any) => d.regions)
//         .filter(Boolean)
//         .flat()
//         .map((r: string) => r.split(',').map(s => s.trim()))
//         .flat()
//         .sort((a: string, b: string) => a.localeCompare(b));
//       uniqueBiogeographicalRegions.value = [...new Set(biog)];
//     })
//     .catch((e: unknown) => console.error('Failed to load sample map data', e));
});

// Watch for language changes and refresh results
watch(locale, () => {
  if (searchQuery.value.trim()) {
    search();
  } else {
    loadAllArticles();
  }
});

// Deep link: /explorer/explorer?document=<document_uid> (e.g. from pin board)
watch(
  () => getDocumentUidFromQuery(route.query),
  (uid, prev) => {
    if (uid && uid !== prev) {
      void openDocumentFromQueryParam(uid);
    }
  }
);

// Select all results by default whenever results change
watch(
  () => searchStore.resultsData?.hits,
  (hits) => {
    if (!hits || !Array.isArray(hits)) return;
    selection.clear();
    selection.selected = hits.map((hit: any) => ({
      id: hit.id,
      title: hit.document?.title || "",
      document: hit.document,
    }));
  },
  { immediate: true }
);
</script>

<style scoped>
button {
  cursor: pointer;
}

.transition-all {
  transition: all 0.3s ease;
}

.side-panel-enter-active,
.side-panel-leave-active {
  transition: transform 0.3s ease;
}

.side-panel-enter-from,
.side-panel-leave-to {
  transform: translateX(-100%);
}
</style>
