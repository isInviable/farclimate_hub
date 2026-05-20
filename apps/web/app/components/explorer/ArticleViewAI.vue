<template>
  <div
    class="article-view relative isolate flex flex-col h-full min-h-0"
    :class="chrome === 'page' ? 'mx-auto container' : 'overflow-hidden p-6 pt-4'"
  >
    <DecorativeCorner
      v-if="activeDecoration"
      :src="activeDecoration.src"
      :corner="activeDecoration.corner"
      :size-class="activeDecoration.sizeClass"
      class="z-0"
    />

    <ArticleTextSelectionCapture
      source-view="article"
      class="relative z-10 flex min-h-0 flex-1 flex-col"
    >
      <header class="grid shrink-0 grid-cols-5 gap-4">
        <div class="col-span-1">
          <div class="flex flex-col gap-2">
            <RollingMenuRail
              :items="primaryItems"
              :active-id="activePrimaryId"
              panel-id-prefix="article-primary"
              @update:active-id="onPrimaryChange"
            />
          </div>
        </div>
        <div class="col-span-4 flex flex-col justify-between gap-4">
          <ArticleSecondarySlideNav
            v-if="showSecondaryNav"
            :slides="recipeNavSlides"
            :active-index="activeRecipeSegmentIndex"
            @update:active-index="onRecipeSegmentNavClick"
          />
          <h2
            v-if="headerShowTitle"
            class="leading-tight scroll-mt-4"
          >
            <span
              v-if="headerNumberPrefix"
              class="text-neutral-700 font-mono mr-1 text-4xl md:text-5xl font-semibold"
            >{{ headerNumberPrefix }}</span>
            <span
              class="text-4xl md:text-6xl text-primary-600 font-display capitalize font-bold"
            >{{ headerSlideLabel }}</span>
          </h2>
        </div>
      </header>

      <div class="min-h-0 flex-1 overflow-hidden">
        <!-- Recipe: scroll stack (Summary+ → sections → map); submenu scroll-spy in script -->
        <div
          v-show="activePrimaryId === 'recipe'"
          id="article-primary-recipe"
          role="tabpanel"
          class="mt-16 flex h-full min-h-0 min-w-0 flex-col"
        >
          <div
            v-if="recipeLoadError"
            class="mb-4 shrink-0 space-y-2"
          >
            <UAlert
              color="error"
              variant="subtle"
              :title="t('recipe.loadErrorTitle')"
              :description="t('recipe.loadErrorDescription')"
            />
            <UButton
              size="sm"
              color="neutral"
              variant="soft"
              @click="loadRecipe"
            >
              {{ t("recipe.retry") }}
            </UButton>
          </div>

          <div
            v-else-if="recipeLoading"
            class="shrink-0 space-y-4 py-2"
          >
            <USkeleton class="h-8 w-2/3 rounded" />
            <USkeleton class="h-32 w-full rounded-lg" />
            <USkeleton class="h-24 w-full rounded-lg" />
          </div>

          <div
            v-else
            ref="recipeScrollRoot"
            class="recipe-scroll-stack scrollbar scrollbar-thumb-black scrollbar-track-white min-h-0 flex-1 overflow-y-auto scroll-smooth pb-8"
            @scroll.passive="onRecipeScrollAreaScroll"
          >
            <!-- Summary+ -->
            <section
              data-testid="article-recipe-segment-summary-plus"
              data-recipe-segment-index="0"
              class="grid scroll-mt-28 grid-cols-1 gap-x-8 gap-y-6 border-b border-default/15 pb-12 lg:grid-cols-7"
            >
              <aside
                class="w-full max-w-sm shrink-0 self-start lg:sticky lg:top-4 lg:col-span-2"
              >
                <div class="uppercase text-xs text-neutral-600 font-mono font-medium">
                  {{ t("article.caseStudyKicker") }}
                </div>
                <h3
                  class="font-display text-black text-2xl font-bold leading-tight tracking-tight"
                >
                  {{ paperTitle }}
                </h3>
                <SummaryMainLeftColumn :document="document" />
              </aside>
              <div class="flex min-w-0 flex-col gap-4 lg:col-span-5">
                <SummaryMainContent
                  :document="document"
                  :parsed-document="parsedDocument"
                />
                <SummaryMainGallery :document="document" />
                <UAlert
                  v-if="recipeSections.length === 0"
                  color="neutral"
                  variant="subtle"
                  :title="t('recipe.emptyTitle')"
                  :description="t('recipe.emptyDescription')"
                  class="max-w-prose"
                />
              </div>
            </section>

            <!-- Markdown sections -->
            <section
              v-for="(section, idx) in recipeSections"
              :key="section.key"
              :data-testid="`article-recipe-segment-${section.key}`"
              :data-recipe-segment-index="1 + idx"
              class="grid scroll-mt-28 grid-cols-1 gap-x-8 gap-y-6 border-b border-default/15 py-12 last:border-b-0 lg:grid-cols-7"
            >
              <aside
                class="relative flex min-h-40 w-full max-w-sm shrink-0 items-center justify-center self-start overflow-hidden rounded-lg bg-elevated/30 lg:sticky lg:top-4 lg:col-span-2"
                aria-hidden="true"
              >
                <div class="relative flex h-44 w-full items-center justify-center">
                  <!-- <DecorativeCorner
                    :src="decorationForMarkdownIndex(idx).src"
                    :corner="decorationForMarkdownIndex(idx).corner"
                    size-class="max-w-[220px] max-h-[220px] w-auto h-auto opacity-90"
                  /> -->
                  <!-- <UIcon
                    :name="section.icon"
                    class="pointer-events-none absolute bottom-3 right-3 size-16 text-primary-500/25"
                  /> -->
                </div>
              </aside>
              <div class="min-w-0 lg:col-span-5  min-h-[50vh]">
                <RecipeSlideBody :section="section" />
              </div>
            </section>

            <!-- Map -->
            <section
              data-testid="article-recipe-segment-map"
              :data-recipe-segment-index="mapSegmentIndex"
              class="grid scroll-mt-28 grid-cols-1 gap-x-8 gap-y-6 pt-8 lg:grid-cols-3"
            >
              <aside
                class="flex w-full max-w-sm shrink-0 items-center justify-center self-start lg:sticky lg:top-4 lg:w-56"
                aria-hidden="true"
              >
                <UIcon
                  name="i-lucide-map"
                  class="size-20 text-primary-400/80"
                />
              </aside>
              <div class="min-h-0 min-w-0">
                <SummaryMapSlide :map-points="mapPoints" />
              </div>
            </section>
          </div>
        </div>

        <!-- Chat -->
        <div
          v-show="activePrimaryId === 'chat'"
          id="article-primary-chat"
          role="tabpanel"
          class="flex h-full min-h-0 min-w-0 gap-6 md:gap-8"
        >
          <aside
            class="w-48 md:w-56 shrink-0 min-h-0"
            aria-hidden="true"
          />
          <div
            class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          >
            <ViewModeChat :document="document" />
          </div>
        </div>

        <!-- Contacts -->
        <div
          v-show="activePrimaryId === 'contacts'"
          id="article-primary-contacts"
          role="tabpanel"
          class="flex h-full min-h-0 min-w-0 gap-6 md:gap-8"
        >
          <aside
            class="w-48 md:w-56 shrink-0 min-h-0"
            aria-hidden="true"
          />
          <div class="relative min-h-0 min-w-0 flex-1 overflow-y-auto">
            <SummaryContactsSlide :document="document" />
          </div>
        </div>
      </div>
    </ArticleTextSelectionCapture>

    <slot name="pins-after" />

    <PinCaptureDialog
      v-model:open="documentPinDialogOpen"
      body-kind="document"
      :title="documentPinDialogTitle ?? undefined"
      :preview="documentPinPreview"
      :saving="documentPinSaving"
      :error="documentPinError"
      @save="saveDocumentPin"
      @cancel="documentPinError = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, provide, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import ArticleTextSelectionCapture from "./ArticleTextSelectionCapture.vue";
import PinCaptureDialog from "./PinCaptureDialog.vue";
import { PinArticleContextKey } from "./pinContext";
import RollingMenuRail from "./article/RollingMenuRail.vue";
import type { Slide } from "./article/SlideDeck.vue";
import ArticleSecondarySlideNav from "./article/ArticleSecondarySlideNav.vue";
import DecorativeCorner from "./article/DecorativeCorner.vue";
import {
  ArticleDecorationContextKey,
  type ArticleDecoration,
  type ArticleDecorationCorner,
} from "./article/articleDecorationContext";
import SummaryMainLeftColumn from "./article/SummaryMainLeftColumn.vue";
import SummaryMainContent from "./article/SummaryMainContent.vue";
import SummaryMainGallery from "./article/SummaryMainGallery.vue";
import SummaryContactsSlide from "./article/SummaryContactsSlide.vue";
import SummaryMapSlide from "./article/SummaryMapSlide.vue";
import RecipeSlideBody from "./article/RecipeSlideBody.vue";
import { useArticleRecipe } from "@/composables/useArticleRecipe";

type PrimaryId = "recipe" | "chat" | "contacts";

const props = withDefaults(
  defineProps<{
    document: Record<string, any>;
    /**
     * Layout chrome the article view is rendered with. `modal` keeps the
     * compact internal padding used inside the explorer modal; `page` adds
     * outer max-width / padding for full-page article routes.
     */
    chrome?: "modal" | "page";
    /** Legacy prop kept for callers; the new layout is responsive on its own. */
    showSidebar?: boolean;
  }>(),
  { chrome: "modal", showSidebar: true },
);

const { t } = useI18n();
const { isAuthenticated } = useAccess();
const { pinCapture } = usePin();
const pinsApi = usePinsSupabase();

const activeDecoration = ref<ArticleDecoration | null>(null);
const activeDecorationSource = ref<symbol | null>(null);

provide(ArticleDecorationContextKey, {
  decoration: activeDecoration,
  setDecoration(source, decoration) {
    activeDecorationSource.value = source;
    activeDecoration.value = decoration;
  },
  clearDecoration(source) {
    if (activeDecorationSource.value !== source) return;
    activeDecorationSource.value = null;
    activeDecoration.value = null;
  },
});

const primaryItems = computed(() => [
  { id: "recipe", label: t("tabs.recipe") },
  { id: "chat", label: t("tabs.chat") },
  { id: "contacts", label: t("tabs.contacts") },
]);

const activePrimaryId = ref<PrimaryId>("recipe");

function onPrimaryChange(id: string): void {
  if (id !== "recipe" && id !== "chat" && id !== "contacts") return;
  activePrimaryId.value = id;
  if (id === "recipe") {
    activeDecoration.value = null;
    activeDecorationSource.value = null;
    activeRecipeSegmentIndex.value = 0;
  }
}

const recipeScrollRoot = ref<HTMLElement | null>(null);
const activeRecipeSegmentIndex = ref(0);
let recipeScrollRaf = 0;

/** Optional IntersectionObserver-based spy was considered (openspec design); scroll-driven index is enough for now. */

const documentIdRef = computed<string | null>(() => {
  const id = (props.document as { id?: unknown })?.id;
  return typeof id === "string" && id.trim() ? id : null;
});

const recipeIngredientsRef = computed<Record<string, string> | null>(() => {
  const raw = (props.document as { recipe_ingredients?: unknown })
    ?.recipe_ingredients;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
    }
    return Object.keys(out).length ? out : null;
  }
  return null;
});

const {
  visibleSections: recipeSections,
  isLoading: recipeLoading,
  loadError: recipeLoadError,
  loadRecipe,
} = useArticleRecipe(documentIdRef, recipeIngredientsRef);

const mapSegmentIndex = computed(
  () => 1 + recipeSections.value.length,
);

const recipeNavSlides = computed<Slide[]>(() => {
  const slides: Slide[] = [
    { id: "summary-plus", label: t("recipe.nav.summaryPlus") },
  ];
  for (const section of recipeSections.value) {
    slides.push({ id: section.key, label: section.title });
  }
  slides.push({ id: "map", label: t("recipe.nav.map") });
  return slides;
});

watch(
  () => recipeNavSlides.value.length,
  (len) => {
    if (activeRecipeSegmentIndex.value >= len) {
      activeRecipeSegmentIndex.value = Math.max(0, len - 1);
    }
  },
);

const showSecondaryNav = computed(
  () =>
    activePrimaryId.value === "recipe" &&
    !recipeLoading.value &&
    !recipeLoadError.value &&
    recipeNavSlides.value.length > 0,
);

function decorationForMarkdownIndex(idx: number): {
  src: string;
  corner: ArticleDecorationCorner;
} {
  return idx % 2 === 0
    ? {
        src: "/img/explorer/bg_image_recipe.png",
        corner: "middle-left",
      }
    : {
        src: "/img/explorer/bg_image_compass.png",
        corner: "bottom-right",
      };
}

function onRecipeSegmentNavClick(idx: number): void {
  const clamped = Math.max(
    0,
    Math.min(idx, recipeNavSlides.value.length - 1),
  );
  activeRecipeSegmentIndex.value = clamped;
  const root = recipeScrollRoot.value;
  if (!root) return;
  const el = root.querySelector(
    `[data-recipe-segment-index="${clamped}"]`,
  ) as HTMLElement | null;
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function onRecipeScrollAreaScroll(): void {
  if (activePrimaryId.value !== "recipe") return;
  if (recipeScrollRaf) cancelAnimationFrame(recipeScrollRaf);
  recipeScrollRaf = requestAnimationFrame(() => {
    recipeScrollRaf = 0;
    syncActiveSegmentFromScroll();
  });
}

function syncActiveSegmentFromScroll(): void {
  const root = recipeScrollRoot.value;
  if (!root || recipeNavSlides.value.length === 0) return;
  const rootRect = root.getBoundingClientRect();
  const line = rootRect.top + 96;
  let chosen = 0;
  for (let i = 0; i < recipeNavSlides.value.length; i++) {
    const el = root.querySelector(
      `[data-recipe-segment-index="${i}"]`,
    ) as HTMLElement | null;
    if (!el) continue;
    if (el.getBoundingClientRect().top <= line) chosen = i;
  }
  if (activeRecipeSegmentIndex.value !== chosen) {
    activeRecipeSegmentIndex.value = chosen;
  }
}

onUnmounted(() => {
  if (recipeScrollRaf) cancelAnimationFrame(recipeScrollRaf);
});

const headerShowTitle = computed(() => {
  if (activePrimaryId.value !== "recipe") return false;
  if (recipeLoading.value || recipeLoadError.value) return false;
  return recipeNavSlides.value.length > 0;
});

const headerSlideLabel = computed(() => {
  if (activePrimaryId.value !== "recipe") return "";
  return (
    recipeNavSlides.value[activeRecipeSegmentIndex.value]?.label ?? ""
  );
});

const headerNumberPrefix = computed(() => {
  if (activePrimaryId.value !== "recipe") return "";
  if (recipeLoading.value || recipeLoadError.value) return "";
  if (!recipeNavSlides.value.length) return "";
  return `${String(activeRecipeSegmentIndex.value + 1).padStart(2, "0")}.`;
});

const paperTitle = computed(() => {
  return props.document.title;
});

const pinDocumentUid = computed<string | null>(() => {
  const doc = props.document as { document_uid?: unknown; id?: unknown } | null;
  const uid = doc?.document_uid;
  if (typeof uid === "string" && uid.trim()) return uid;
  const id = doc?.id;
  if (typeof id === "string" && id.trim()) return id;
  return null;
});

const pinDocumentTitle = computed<string | null>(() => {
  const raw = (props.document as { title?: unknown } | null)?.title;
  return typeof raw === "string" && raw.trim() ? raw : null;
});

const pinDocumentLocation = computed<[number, number] | null>(() => {
  const raw = (props.document as { location?: unknown } | null)?.location;
  if (!Array.isArray(raw) || raw.length !== 2) return null;
  const [lat, lon] = raw as unknown[];
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  if (lat === 0 && lon === 0) return null;
  return [lat, lon];
});

provide(PinArticleContextKey, {
  documentUid: pinDocumentUid,
  title: pinDocumentTitle,
  location: pinDocumentLocation,
});

const documentPinDialogOpen = ref(false);
const documentPinSaving = ref(false);
const documentPinError = ref<string | null>(null);

const documentPinDialogTitle = computed(() => pinDocumentTitle.value);

const documentPinPreview = computed(() => {
  const doc = props.document as { subtitle?: string } | null;
  const s = doc?.subtitle;
  return typeof s === "string" && s.trim() ? s.trim() : "";
});

async function saveDocumentPin(note: string): Promise<void> {
  if (!pinDocumentUid.value) return;
  documentPinSaving.value = true;
  documentPinError.value = null;
  try {
    const id = await pinCapture({
      bodyKind: "document",
      title: pinDocumentTitle.value ?? undefined,
      data: {},
      notes: note,
      sourceDocumentUid: pinDocumentUid.value,
      location: pinDocumentLocation.value,
      animationElement: null,
    });
    if (!id) {
      documentPinError.value = pinsApi.error.value ?? "Could not save pin";
      return;
    }
    documentPinDialogOpen.value = false;
  } finally {
    documentPinSaving.value = false;
  }
}

defineExpose({
  openDocumentPinDialog: () => {
    documentPinError.value = null;
    documentPinDialogOpen.value = true;
  },
  isAuthenticated,
});

const parsedDocument = computed(() => {
  if (!props.document) return {};
  const doc = props.document as Record<string, any>;

  const splitToArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [];
  };

  return {
    sectorsArray: splitToArray(doc.sectors),
    hazardsArray: splitToArray(doc.climate_impacts),
    adaptationApproachesArray: splitToArray(doc.adaptation_approaches),
    keywordsArray: splitToArray(doc.keywords),
    implementation_years: doc.implementation_years
      ? `${doc.implementation_years.start_year ?? "N/A"} – ${
          doc.implementation_years.end_year ?? "N/A"
        }`
      : "",
  };
});

const mapPoints = computed(() => {
  const doc = props.document as Record<string, any>;
  if (
    doc?.location &&
    Array.isArray(doc.location) &&
    doc.location.length === 2 &&
    typeof doc.location[0] === "number" &&
    typeof doc.location[1] === "number"
  ) {
    return [
      {
        label: typeof doc.title === "string" ? doc.title : "",
        location: { lat: doc.location[0], lon: doc.location[1] },
        articleId: doc.id,
      },
    ];
  }
  return [];
});
</script>
