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
      class="relative z-10 min-h-0 flex-1"
    >
      <!-- Row 1: Chat / Recipe / Summary rail + submenu + active slide title -->
      <header class="grid grid-cols-5 gap-4">
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
        <div class="col-span-4 flex justify-between flex-col gap-4">
          <ArticleSecondarySlideNav
            v-if="showSecondaryNav"
            :slides="secondaryNavSlides"
            :active-index="activeSecondaryIndex"
            @update:active-index="onSecondaryIndex"
          />
          <h2 v-if="headerShowTitle" class="leading-tight scroll-mt-4">
            <span
              v-if="headerNumberPrefix"
              class="text-muted font-mono mr-1 text-4xl md:text-5xl font-semibold"
              >{{ headerNumberPrefix }}</span
            >
            <span
              class="text-4xl md:text-6xl text-primary-600 font-display capitalize font-bold"
              >{{ headerSlideLabel }}</span
            >
          </h2>
        </div>
      </header>

      <!-- Row 2: Summary uses grid (left metadata + col-span-4 slide); recipe/chat unchanged -->
      <div class="mt-16">
        <!-- Summary: fixed left column + rotating slide in col-span-4 -->
        <div
          v-show="activePrimaryId === 'summary'"
          :id="`article-primary-summary`"
          role="tabpanel"
          class="grid grid-cols-4  gap-40"
        >
          <div class="col-span-1 min-h-0 min-w-0">
            <!-- basic info block-->
            <div>
              <div class="uppercase text-xs text-neutral-600 font-mono font-medium"> EXPLORER · CASE STUDY</div>
              <h2
                class="font-display text-black text-2xl font-bold leading-tight tracking-tight "
              >
                {{ paperTitle }}
              </h2>
             
            </div>
            <SummaryMainLeftColumn :document="document" />
          </div>
          <div class="col-span-3 min-h-0 min-w-0 flex flex-col">
            <div
              v-if="summaryIndex === 0"
              class="flex min-h-0 flex-1 flex-col gap-4"
            >
              <div class="relative min-h-0 flex-1 overflow-y-auto">
                <SummaryMainContent
                  :document="document"
                  :parsed-document="parsedDocument"
                />
              </div>
              <SummaryMainGallery :document="document" />
            </div>
            <div
              v-if="summaryIndex === 1"
              class="relative min-h-0 flex-1 overflow-y-auto"
            >
              <SummaryContactsSlide :document="document" />
            </div>
            <div v-if="summaryIndex === 2" class="relative min-h-0 flex-1">
              <SummaryMapSlide :map-points="mapPoints" />
            </div>
          </div>
        </div>

        <!-- Recipe -->
        <div
          v-if="activePrimaryId === 'recipe'"
          :id="`article-primary-recipe`"
          role="tabpanel"
          class="flex flex-1 min-h-0 min-w-0 gap-6 md:gap-8"
        >
          <aside class="w-48 md:w-56 shrink-0 min-h-0" aria-hidden="true" />
          <div class="flex-1 min-w-0 min-h-0 flex flex-col relative">
            <div v-if="recipeLoadError" class="space-y-2">
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

            <div v-else-if="recipeLoading" class="space-y-4">
              <USkeleton class="h-8 w-2/3 rounded" />
              <USkeleton class="h-32 w-full rounded-lg" />
              <USkeleton class="h-24 w-full rounded-lg" />
            </div>

            <UAlert
              v-else-if="recipeSlides.length === 0"
              color="neutral"
              variant="subtle"
              :title="t('recipe.emptyTitle')"
              :description="t('recipe.emptyDescription')"
            />

            <SlideDeck
              v-else
              class="flex-1 min-h-0"
              :slides="recipeSlides"
              :active-index="recipeIndex"
              panel-id="recipe-slide"
              @update:active-index="recipeIndex = $event"
            >
              <template
                v-for="section in recipeSections"
                :key="section.key"
                #[section.key]
              >
                <RecipeSlideBody :section="section" />
              </template>
            </SlideDeck>
          </div>
        </div>

        <!-- Chat -->
        <div
          v-show="activePrimaryId === 'chat'"
          :id="`article-primary-chat`"
          role="tabpanel"
          class="flex flex-1 min-h-0 min-w-0 gap-6 md:gap-8"
        >
          <aside class="w-48 md:w-56 shrink-0 min-h-0" aria-hidden="true" />
          <div class="flex-1 min-w-0 min-h-0 overflow-y-auto">
            <ViewModeChat :document="document" />
          </div>
        </div>
      </div>
    </ArticleTextSelectionCapture>

    <!-- Pinned items list (kept inline below; only used by side panel modal) -->
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
import { computed, provide, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import ArticleTextSelectionCapture from "./ArticleTextSelectionCapture.vue";
import PinCaptureDialog from "./PinCaptureDialog.vue";
import { PinArticleContextKey } from "./pinContext";
import RollingMenuRail from "./article/RollingMenuRail.vue";
import SlideDeck, { type Slide } from "./article/SlideDeck.vue";
import ArticleSecondarySlideNav from "./article/ArticleSecondarySlideNav.vue";
import DecorativeCorner from "./article/DecorativeCorner.vue";
import {
  ArticleDecorationContextKey,
  type ArticleDecoration,
} from "./article/articleDecorationContext";
import SummaryMainLeftColumn from "./article/SummaryMainLeftColumn.vue";
import SummaryMainContent from "./article/SummaryMainContent.vue";
import SummaryMainGallery from "./article/SummaryMainGallery.vue";
import SummaryContactsSlide from "./article/SummaryContactsSlide.vue";
import SummaryMapSlide from "./article/SummaryMapSlide.vue";
import RecipeSlideBody from "./article/RecipeSlideBody.vue";
import { useArticleRecipe } from "@/composables/useArticleRecipe";

type PrimaryId = "chat" | "recipe" | "summary";

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

// Nested slide components decide which decoration is active, but the image is
// rendered here so absolute positioning is relative to the article viewport.
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

// --- Primary "rolling menu" state ---------------------------------------

// Canonical order: Chat, Recipe, Summary. Rendering rule (active at bottom)
// is owned by `RollingMenuRail`; this list is the source of truth.
const primaryItems = computed(() => [
  { id: "chat", label: t("tabs.chat") },
  { id: "recipe", label: t("tabs.recipe") },
  { id: "summary", label: t("tabs.summary") },
]);

const activePrimaryId = ref<PrimaryId>("summary");

function onPrimaryChange(id: string): void {
  if (id !== "summary" && id !== "recipe" && id !== "chat") return;
  activePrimaryId.value = id;
  // Reset secondary slide state on primary change (per spec).
  summaryIndex.value = 0;
  recipeIndex.value = 0;
}

// --- Summary slides ------------------------------------------------------

const summaryIndex = ref(0);

const summarySlides = computed<Slide[]>(() => [
  { id: "main", label: t("summary.slides.main") },
  { id: "contacts", label: t("summary.slides.contacts") },
  { id: "map", label: t("summary.slides.map") },
]);

// --- Recipe slides -------------------------------------------------------

const recipeIndex = ref(0);

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

const recipeSlides = computed<Slide[]>(() =>
  recipeSections.value.map(
    (section, idx): Slide => ({
      id: section.key,
      label: section.title,
      decoration:
        idx % 2 === 0
          ? {
              src: "/img/explorer/bg_image_recipe.png",
              corner: "middle-left",
            }
          : {
              src: "/img/explorer/bg_image_compass.png",
              corner: "bottom-right",
            },
    }),
  ),
);

// Reset recipe slide index if section list shrinks below current index.
watch(recipeSections, (sections) => {
  if (recipeIndex.value >= sections.length) {
    recipeIndex.value = 0;
  }
});

// --- Header: secondary nav + title (aligned with Figma two-row layout) ---

const showSecondaryNav = computed(
  () =>
    (activePrimaryId.value === "summary" && summarySlides.value.length > 0) ||
    (activePrimaryId.value === "recipe" &&
      !recipeLoading.value &&
      !recipeLoadError.value &&
      recipeSlides.value.length > 0),
);

const secondaryNavSlides = computed<Slide[]>(() => {
  if (activePrimaryId.value === "summary") return summarySlides.value;
  if (activePrimaryId.value === "recipe") return recipeSlides.value;
  return [];
});

const activeSecondaryIndex = computed(() =>
  activePrimaryId.value === "summary"
    ? summaryIndex.value
    : activePrimaryId.value === "recipe"
      ? recipeIndex.value
      : 0,
);

function onSecondaryIndex(idx: number): void {
  if (activePrimaryId.value === "summary") summaryIndex.value = idx;
  else if (activePrimaryId.value === "recipe") recipeIndex.value = idx;
}

const headerShowTitle = computed(() => {
  if (activePrimaryId.value === "chat") return true;
  if (activePrimaryId.value === "summary")
    return summarySlides.value.length > 0;
  if (activePrimaryId.value === "recipe") {
    if (recipeLoading.value || recipeLoadError.value) return false;
    return recipeSlides.value.length > 0;
  }
  return false;
});

const headerSlideLabel = computed(() => {
  if (activePrimaryId.value === "chat") return t("tabs.chat");
  if (activePrimaryId.value === "summary") {
    return summarySlides.value[summaryIndex.value]?.label ?? "";
  }
  if (activePrimaryId.value === "recipe") {
    return recipeSlides.value[recipeIndex.value]?.label ?? "";
  }
  return "";
});

/** Zero-padded slide index (01., 02., …) for summary/recipe; chat has no prefix. */
const headerNumberPrefix = computed(() => {
  if (activePrimaryId.value === "chat") return "";
  if (activePrimaryId.value === "summary") {
    if (!summarySlides.value.length) return "";
    return `${String(summaryIndex.value + 1).padStart(2, "0")}.`;
  }
  if (activePrimaryId.value === "recipe") {
    if (recipeLoading.value || recipeLoadError.value) return "";
    if (!recipeSlides.value.length) return "";
    return `${String(recipeIndex.value + 1).padStart(2, "0")}.`;
  }
  return "";
});

const paperTitle = computed(() => {
  return props.document.title;
});

const geographicLocationString = computed(() => {
  return (
    props.document.geographic_characterisation?.city +
    ", " +
    props.document.geographic_characterisation?.countries
  );
});

const yearString = computed(() => {
  return (
    props.document.implementation_years?.start_year +
    " - " +
    props.document.implementation_years?.end_year
  );
});

// --- Pin context (shared with selectable / capturable blocks) ----------

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

// --- Document-level pin dialog (kept for parity with previous toolbar) -

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

// Expose a way for an external chrome (e.g. the modal pin icon) to open the
// document pin dialog without re-mounting the dialog elsewhere.
defineExpose({
  openDocumentPinDialog: () => {
    documentPinError.value = null;
    documentPinDialogOpen.value = true;
  },
  isAuthenticated,
});

// --- Parsed metadata for the Main slide --------------------------------

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

// --- Map points ---------------------------------------------------------

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
