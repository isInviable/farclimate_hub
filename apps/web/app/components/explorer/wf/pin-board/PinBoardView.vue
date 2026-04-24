<template>
  <div class="flex">
    <aside class="w-64 mr-4 border-r border-gray-200 min-h-screen p-6 shrink-0">
      <h3 class="font-semibold text-gray-800 mb-4">
        {{ $t("pins.sectionsByKind") }}
      </h3>
      <div class="space-y-2">
        <button
          v-for="cat in sidebarCategories"
          :key="cat.value"
          type="button"
          class="w-full text-left px-4 py-2 rounded-lg transition-colors"
          :class="[
            isKindSelected(cat.value)
              ? 'bg-neutral-500 text-white'
              : 'text-gray-700 hover:bg-gray-100',
          ]"
          @click="selectKind(cat.value)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="truncate">{{ cat.label }}</span>
            <span class="text-sm opacity-75 shrink-0">{{ cat.count }}</span>
          </div>
        </button>
      </div>

      <div class="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          class="w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between gap-2"
          :class="[
            !mapEntryEnabled
              ? 'text-gray-400 cursor-not-allowed'
              : selectedView === 'map'
              ? 'bg-neutral-500 text-white'
              : 'text-gray-700 hover:bg-gray-100',
          ]"
          :disabled="!mapEntryEnabled"
          :aria-disabled="!mapEntryEnabled"
          :title="!mapEntryEnabled ? $t('pins.map.emptyTooltip') : undefined"
          @click="selectMap"
        >
          <span class="flex items-center gap-2 truncate">
            <Icon name="mdi:map-outline" class="shrink-0" />
            <span class="truncate">{{ $t("pins.map.label") }}</span>
          </span>
          <span class="text-sm opacity-75 shrink-0">{{
            mapArticleCount
          }}</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 p-8 min-w-0">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">
          {{ $t("pins.boardTitle") }}
        </h1>
        <p class="text-gray-600">
          {{ summaryLine }}
        </p>
      </div>

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
          class="w-10 h-10 animate-spin text-primary-500"
        />
      </div>

      <template v-else-if="selectedView === 'map'">
        <div class="w-full h-[70vh] rounded-lg overflow-hidden border border-gray-200 bg-white">
          <PinBoardMap :pins="props.pins" @open-article="handleOpenArticleFromMap" />
        </div>
      </template>

      <template v-else>
        <div
          v-if="flatFilteredPins.length === 0"
          class="text-center py-12">
          <Icon name="mdi:pin-off" size="4rem" class="mx-auto text-gray-400 mb-4" />
          <h3 class="text-xl font-semibold text-gray-600 mb-2">
            {{ emptyTitle }}
          </h3>
          <p class="text-gray-500">
            {{ emptyCategory }}
          </p>
        </div>

        <div v-else class="space-y-10">
          <section
            v-for="section in visibleSections"
            :key="section.bodyKind"
          >
            <h2
              class="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-neutral-200"
            >
              {{ sectionLabel(section.bodyKind) }}
              <span class="text-sm font-normal text-neutral-500 ml-2">
                ({{ section.pins.length }})
              </span>
            </h2>
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <PinBoardCard
                v-for="pin in section.pins"
                :key="pin.id"
                :pin="pin"
                :enable-selection="enableSelection"
                @open-article="openArticle"
              />
            </div>
          </section>
        </div>
      </template>
    </main>

    <ArticleSidePanel
      v-if="openedArticleUid"
      :open="openedArticleUid !== null"
      :document-uid="openedArticleUid"
      :title-fallback="titleFallback"
      :pins="openedArticlePins"
      @close="openedArticleUid = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { HumanPinRow } from "~/types/pins";
import { groupPinsByBodyKind } from "~/utils/pinBoardSections";
import { groupPinsForMap } from "~/utils/pinBoardMap";
import PinBoardCard from "./PinBoardCard.vue";
import PinBoardMap from "./PinBoardMap.vue";
import ArticleSidePanel from "~/components/explorer/ArticleSidePanel.vue";

const props = withDefaults(
  defineProps<{
    pins: HumanPinRow[]
    loading?: boolean
    error?: string | null
    enableSelection?: boolean
    emptyAllMessage?: string
    emptyCategoryMessage?: string
  }>(),
  {
    loading: false,
    error: null,
    enableSelection: true,
    emptyAllMessage: "",
    emptyCategoryMessage: "",
  }
);

const { t, te } = useI18n();

/**
 * Grid state: selected `body_kind`. Map view lives on a separate axis
 * (`selectedView`) so switching to map doesn't lose the user's kind
 * filter, and switching back to a kind restores the grid automatically.
 */
const selectedKind = ref<string>("all");
const selectedView = ref<"grid" | "map">("grid");

const sections = computed(() => groupPinsByBodyKind(props.pins));

/**
 * Map view data source. Derived from the in-memory pin list only — no
 * server calls. See change `pinboard-global-map`.
 */
const mapGroups = computed(() => groupPinsForMap(props.pins));
const mapArticleCount = computed(() => mapGroups.value.length);
const mapEntryEnabled = computed(() => mapArticleCount.value > 0);

const sidebarCategories = computed(() => {
  const total = props.pins.length;
  const rows: { value: string; label: string; count: number }[] = [
    { value: "all", label: t("pins.filterAll"), count: total },
  ];
  for (const s of sections.value) {
    const key = `pins.kinds.${s.bodyKind}`;
    rows.push({
      value: s.bodyKind,
      label: te(key) ? t(key) : t("pins.kinds.unknown"),
      count: s.pins.length,
    });
  }
  return rows;
});

const visibleSections = computed(() => {
  if (selectedKind.value === "all") return sections.value;
  return sections.value.filter((s) => s.bodyKind === selectedKind.value);
});

const flatFilteredPins = computed(() =>
  visibleSections.value.flatMap((s) => s.pins)
);

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

const summaryLine = computed(() => {
  if (selectedView.value === "map") {
    return t("pins.map.summary", { count: mapArticleCount.value });
  }
  const n = flatFilteredPins.value.length;
  if (selectedKind.value === "all") {
    return t("pins.summaryTotal", { count: n });
  }
  return t("pins.summaryInSection", {
    count: n,
    section: sectionLabel(selectedKind.value),
  });
});

const emptyTitle = computed(() =>
  selectedKind.value === "all"
    ? t("pins.emptyBoardTitle")
    : t("pins.emptySectionTitle")
);

const emptyCategory = computed(() =>
  selectedKind.value === "all"
    ? props.emptyAllMessage || t("pins.boardEmpty")
    : props.emptyCategoryMessage || t("pins.boardEmptyCategory")
);

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
</script>
