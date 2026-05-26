<template>
  <div class="grid grid-cols-12 relative">
    <aside
      class="col-span-3 bg-neutral-200 sticky top-0 h-screen overflow-y-auto border-r border-neutral-darkest scrollbar scrollbar-thumb-neutral-darkest scrollbar-track-neutral-lightest"
    >
      <PinBoardSidebar
        :categories="sidebarCategories"
        :selected-kind="selectedKind"
        :selected-view="selectedView"
        :map-entry-enabled="mapEntryEnabled"
        :map-article-count="mapArticleCount"
        :artifact-count="artifactCount"
        @select-kind="selectKind"
        @select-map="selectMap"
        @select-artifacts="selectArtifacts"
      />
    </aside>

    <main class="col-span-9 min-w-0 bg-warm-neutral-300">
      <header class="px-8 py-9">
        <EditorialEyebrow color="muted" class="tracking-[0.2em]">
          {{ $t("pins.boardEyebrow", "03 · Pinboard") }}
        </EditorialEyebrow>
        <h1 class="font-display font-bold text-5xl mt-2 text-neutral-darkest">
          {{ $t("pins.boardTitle") }}
        </h1>
        <p class="font-sans text-neutral-dark mt-2">
          {{ summaryLine }}
        </p>
      </header>

      <div class="px-8 pb-24">
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          class="mb-4"
          :title="$t('pins.loadError')"
          :description="error"
        />

        <div v-if="loading" class="flex justify-center py-16">
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-10 h-10 animate-spin text-primary-600"
          />
        </div>

        <template v-else-if="selectedView === 'map'">
          <div class="w-full h-[70vh] overflow-hidden border border-neutral-darkest bg-neutral-lightest">
            <PinBoardMap :pins="props.pins" @open-article="handleOpenArticleFromMap" />
          </div>
        </template>

        <template v-else-if="selectedView === 'artifacts'">
          <slot name="artifacts" />
        </template>

        <template v-else>
          <div
            v-if="isGridEmpty"
            class="text-center py-12">
            <Icon name="mdi:pin-off" size="4rem" class="mx-auto text-neutral mb-4" />
            <h3 class="font-display font-semibold text-xl text-neutral-darkest mb-2">
              {{ emptyTitle }}
            </h3>
            <p class="text-neutral-dark">
              {{ emptyCategory }}
            </p>
          </div>

          <div v-else-if="isFullPaperDocumentLayout" class="space-y-12">
            <section>
              <header class="flex items-baseline gap-3 mb-4">
                <h2 class="font-display font-bold text-2xl text-neutral-darkest">
                  {{ $t("pins.fullPaperSectionWhole") }}
                </h2>
                <span class="font-mono text-xs text-neutral-dark tabular-nums">
                  ({{ fullPaperDocumentPins.length }})
                </span>
              </header>
              <p
                v-if="fullPaperDocumentPins.length === 0"
                class="font-sans text-sm text-neutral-dark mb-2"
              >
                {{ $t("pins.fullPaperWholeEmpty") }}
              </p>
              <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 editorial-frame"
              >
                <PinBoardCard
                  v-for="pin in fullPaperDocumentPins"
                  :key="pin.id"
                  :pin="pin"
                  :enable-selection="enableSelection"
                  class="editorial-cell"
                  @open-article="openArticle"
                />
              </div>
            </section>

            <section>
              <header class="flex items-baseline gap-3 mb-4">
                <h2 class="font-display font-bold text-2xl text-neutral-darkest">
                  {{ $t("pins.fullPaperSectionFragmentPapers") }}
                </h2>
                <span class="font-mono text-xs text-neutral-dark tabular-nums">
                  ({{ fragmentBackedPaperGroups.length }})
                </span>
              </header>
              <p
                v-if="fragmentBackedPaperGroups.length === 0"
                class="font-sans text-sm text-neutral-dark mb-2"
              >
                {{ $t("pins.fullPaperFragmentPapersEmpty") }}
              </p>
              <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 editorial-frame"
              >
                <article
                  v-for="g in fragmentBackedPaperGroups"
                  :key="g.source_document_uid"
                  class="editorial-cell relative group p-6 flex flex-col gap-3 min-h-[200px]"
                >
                  <h3 class="font-display font-bold text-lg text-neutral-darkest line-clamp-2">
                    {{ g.displayTitle }}
                  </h3>
                  <p class="font-sans text-sm text-neutral-dark">
                    {{
                      $t("pins.fullPaperFragmentPinCount", {
                        count: g.pins.length,
                      })
                    }}
                  </p>
                  <div class="mt-auto">
                    <UButton
                      size="sm"
                      color="primary"
                      variant="editorial"
                      icon="i-heroicons-document-text"
                      @click="openArticle(g.source_document_uid)"
                    >
                      {{ $t("pins.drawer.openArticle") }}
                    </UButton>
                  </div>
                </article>
              </div>
            </section>
          </div>

          <div v-else class="space-y-12">
            <section v-if="showSavedSearchesBlock">
              <header class="flex items-baseline gap-3 mb-4">
                <h2 class="font-display font-bold text-2xl text-neutral-darkest">
                  {{ $t("pins.sidebarSavedSearches") }}
                </h2>
                <span class="font-mono text-xs text-neutral-dark tabular-nums">
                  ({{ savedSearches.length }})
                </span>
              </header>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 editorial-frame">
                <PinBoardSavedSearchCard
                  v-for="s in savedSearches"
                  :key="s.id"
                  :saved-search="s"
                  :enable-selection="enableSelection"
                  class="editorial-cell"
                />
              </div>
            </section>

            <section
              v-for="section in visiblePinSections"
              :key="section.bodyKind"
            >
              <header class="flex items-baseline gap-3 mb-4">
                <h2 class="font-display font-bold text-2xl text-neutral-darkest">
                  {{ sectionLabel(section.bodyKind) }}
                </h2>
                <span class="font-mono text-xs text-neutral-dark tabular-nums">
                  ({{ section.pins.length }})
                </span>
              </header>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 editorial-frame">
                <PinBoardCard
                  v-for="pin in section.pins"
                  :key="pin.id"
                  :pin="pin"
                  :enable-selection="enableSelection"
                  class="editorial-cell"
                  @open-article="openArticle"
                />
              </div>
            </section>
          </div>
        </template>
      </div>
    </main>

    <ArticleSidePanel
      v-if="openedArticleUid"
      :open="openedArticleUid !== null"
      :document-uid="openedArticleUid"
      :title-fallback="titleFallback"
      :pins="openedArticlePins"
      :navigation-items="pinBoardArticleNavigationItems"
      @navigate="handleSidePanelNavigate"
      @close="openedArticleUid = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { HumanPinRow } from "~/types/pins";
import {
  fullPaperDocumentPinsSorted,
  groupFragmentPinsByDocumentUid,
} from "~/utils/pinBoardFullPaperGroups";
import { groupPinsForMap } from "~/utils/pinBoardMap";
import { groupPinsByBodyKind } from "~/utils/pinBoardSections";
import PinBoardCard from "./PinBoardCard.vue";
import PinBoardSavedSearchCard from "./PinBoardSavedSearchCard.vue";
import PinBoardMap from "./PinBoardMap.vue";
import PinBoardSidebar from "./PinBoardSidebar.vue";
import ArticleSidePanel from "~/components/explorer/ArticleSidePanel.vue";
import type { ArticlePanelNavItem } from "~/components/explorer/ArticleSidePanel.vue";
import { useProjectsStore } from "@/stores/projects";

const KIND_SAVED_SEARCHES = "__saved_searches__";
/** Legacy `body_kind` for pins; saved filters use `saved_searches` + sidebar `KIND_SAVED_SEARCHES` instead. */
const LEGACY_SAVED_SEARCH_BODY_KIND = "saved_search";

const props = withDefaults(
  defineProps<{
    pins: HumanPinRow[]
    loading?: boolean
    error?: string | null
    enableSelection?: boolean
    includeSavedSearches?: boolean
    emptyAllMessage?: string
    emptyCategoryMessage?: string
    artifactCount?: number
  }>(),
  {
    loading: false,
    error: null,
    enableSelection: true,
    includeSavedSearches: true,
    emptyAllMessage: "",
    emptyCategoryMessage: "",
    artifactCount: 0,
  }
);

const { t, te } = useI18n();
const projectsStore = useProjectsStore();
const savedSearchesApi = useSavedSearchesSupabase();

watch(
  [() => projectsStore.currentProjectId, () => props.includeSavedSearches],
  ([id, includeSavedSearches]) => {
    void savedSearchesApi.fetchSavedSearches(includeSavedSearches ? id : null);
  },
  { immediate: true }
);

const savedSearches = computed(() => savedSearchesApi.savedSearches.value);

/**
 * Grid state: selected `body_kind`. Map view lives on a separate axis
 * (`selectedView`) so switching to map doesn't lose the user's kind
 * filter, and switching back to a kind restores the grid automatically.
 */
const selectedKind = ref<string>("all");
const selectedView = ref<"grid" | "map" | "artifacts">("grid");

const sections = computed(() => groupPinsByBodyKind(props.pins));

const fullPaperDocumentPins = computed(() =>
  fullPaperDocumentPinsSorted(props.pins),
);

const fragmentBackedPaperGroups = computed(() =>
  groupFragmentPinsByDocumentUid(props.pins),
);

const isFullPaperDocumentLayout = computed(
  () => selectedView.value === "grid" && selectedKind.value === "document",
);

/**
 * Map view data source. Derived from the in-memory pin list only — no
 * server calls. See change `pinboard-global-map`.
 */
const mapGroups = computed(() => groupPinsForMap(props.pins));
const mapArticleCount = computed(() => mapGroups.value.length);
const mapEntryEnabled = computed(() => mapArticleCount.value > 0);

const sidebarCategories = computed(() => {
  const nPins = props.pins.length;
  const nSaved = savedSearches.value.length;
  const rows: { value: string; label: string; count: number }[] = [
    { value: "all", label: t("pins.filterAll"), count: nPins + nSaved },
  ];
  for (const s of sections.value) {
    if (s.bodyKind === LEGACY_SAVED_SEARCH_BODY_KIND) continue;
    const key = `pins.kinds.${s.bodyKind}`;
    rows.push({
      value: s.bodyKind,
      label: te(key) ? t(key) : t("pins.kinds.unknown"),
      count: s.pins.length,
    });
  }
  rows.push({
    value: KIND_SAVED_SEARCHES,
    label: t("pins.sidebarSavedSearches"),
    count: nSaved,
  });
  return rows;
});

const visiblePinSections = computed(() => {
  if (selectedKind.value === KIND_SAVED_SEARCHES) return [];
  const withoutLegacySavedSearch = sections.value.filter(
    (s) => s.bodyKind !== LEGACY_SAVED_SEARCH_BODY_KIND
  );
  if (selectedKind.value === "all") return withoutLegacySavedSearch;
  return withoutLegacySavedSearch.filter(
    (s) => s.bodyKind === selectedKind.value
  );
});

const showSavedSearchesBlock = computed(() => {
  if (savedSearches.value.length === 0) return false;
  return (
    selectedKind.value === "all" || selectedKind.value === KIND_SAVED_SEARCHES
  );
});

const flatFilteredPins = computed(() =>
  visiblePinSections.value.flatMap((s) => s.pins)
);

const pinBoardArticleNavigationItems = computed<ArticlePanelNavItem[]>(() => {
  const seen = new Set<string>();
  const out: ArticlePanelNavItem[] = [];
  for (const pin of flatFilteredPins.value) {
    const uid = pin.source_document_uid?.trim();
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    const title = pin.source_title_snapshot?.trim() || "—";
    out.push({ uid, title });
  }
  return out;
});

function handleSidePanelNavigate(uid: string) {
  openedArticleUid.value = uid;
}

const pinCountInGrid = computed(() =>
  visiblePinSections.value.reduce((acc, s) => acc + s.pins.length, 0)
);

const isGridEmpty = computed(() => {
  if (selectedView.value === "map") return false;
  if (selectedKind.value === KIND_SAVED_SEARCHES) {
    return savedSearches.value.length === 0;
  }
  if (selectedKind.value === "all") {
    return pinCountInGrid.value === 0 && savedSearches.value.length === 0;
  }
  if (selectedKind.value === "document") {
    return (
      fullPaperDocumentPins.value.length === 0 &&
      fragmentBackedPaperGroups.value.length === 0
    );
  }
  return pinCountInGrid.value === 0;
});

function sectionLabel(kind: string): string {
  const key = `pins.kinds.${kind}`;
  return te(key) ? t(key) : t("pins.kinds.unknown");
}

function isKindSelected(kind: string): boolean {
  return selectedView.value === "grid" && selectedKind.value === kind;
}

function selectKind(kind: string) {
  selectedKind.value = kind;
  selectedView.value = "grid";
}

function selectMap() {
  if (!mapEntryEnabled.value) return;
  selectedView.value = "map";
}

function selectArtifacts() {
  selectedView.value = "artifacts";
}

const summaryLine = computed(() => {
  if (selectedView.value === "artifacts") {
    return t("podcast.artifacts.description");
  }
  if (selectedView.value === "map") {
    return t("pins.map.summary", { count: mapArticleCount.value });
  }
  if (selectedKind.value === KIND_SAVED_SEARCHES) {
    return t("pins.summarySavedSearchesOnly", {
      count: savedSearches.value.length,
    });
  }
  if (selectedKind.value === "all") {
    const n = pinCountInGrid.value + savedSearches.value.length;
    return t("pins.summaryBoardTotal", { count: n });
  }
  if (selectedKind.value === "document") {
    return t("pins.summaryFullPaperView", {
      whole: fullPaperDocumentPins.value.length,
      papersWithFragments: fragmentBackedPaperGroups.value.length,
    });
  }
  const n = flatFilteredPins.value.length;
  return t("pins.summaryInSection", {
    count: n,
    section: sectionLabel(selectedKind.value),
  });
});

const emptyTitle = computed(() => {
  if (selectedKind.value === KIND_SAVED_SEARCHES) {
    return t("pins.emptySavedSearchesTitle");
  }
  if (selectedKind.value === "document") {
    return t("pins.emptyFullPaperTitle");
  }
  return selectedKind.value === "all"
    ? t("pins.emptyBoardTitle")
    : t("pins.emptySectionTitle");
});

const emptyCategory = computed(() => {
  if (selectedKind.value === KIND_SAVED_SEARCHES) {
    return t("pins.savedSearchMenuEmpty");
  }
  if (selectedKind.value === "document") {
    return t("pins.emptyFullPaperHint");
  }
  return selectedKind.value === "all"
    ? props.emptyAllMessage || t("pins.boardEmpty")
    : props.emptyCategoryMessage || t("pins.boardEmptyCategory");
});

/**
 * Article-drawer state shared between the map popup and the grid cards.
 * Lives at the view level so it survives view switches (map <-> grid)
 * and so both pages (`/board` and `/board/public/[id]`) inherit it.
 */
const openedArticleUid = ref<string | null>(null);

const openedArticlePins = computed<HumanPinRow[]>(() => {
  const uid = openedArticleUid.value;
  if (!uid) return [];
  return props.pins.filter((p) => p.source_document_uid === uid);
});

const titleFallback = computed<string | null>(() => {
  const first = openedArticlePins.value[0];
  return first?.source_title_snapshot ?? null;
});

function openArticle(uid: string | null | undefined) {
  if (!uid) return;
  openedArticleUid.value = uid;
}

function handleOpenArticleFromMap(payload: { documentUid: string }) {
  openArticle(payload?.documentUid);
}

defineExpose({
  selectArtifacts,
})
</script>
