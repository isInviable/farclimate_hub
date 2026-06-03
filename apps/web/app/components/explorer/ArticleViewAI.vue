<template>
  <div
    class="article-view relative isolate flex h-full min-h-0 w-full min-w-0 flex-col"
    :class="chrome === 'page' ? 'mx-auto container' : 'overflow-hidden p-6 pt-4'"
  >
    <ArticleTextSelectionCapture
      source-view="article"
      class="relative z-10 flex min-h-0 flex-1 flex-col"
    >
      <header
        class="relative z-20 grid min-w-0 shrink-0 grid-cols-5 items-center gap-4 border-b border-default/10 bg-neutral-lightest pb-3"
      >
        <div class="col-span-1 min-w-0">
          <p
            class="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600"
          >
            {{ t("article.caseStudyKicker") }}
          </p>
          <h1
            class="font-display mt-1 text-base font-bold leading-tight tracking-tight text-neutral-darkest"
          >
            {{ paperTitle }}
          </h1>
        </div>
        <div class="col-span-4 flex min-w-0 flex-col pr-24">
          <ArticlePrimaryNav
            :items="primaryItems"
            :active-id="activePrimaryId"
            panel-id-prefix="article-primary"
            @update:active-id="onPrimaryChange"
          />
        </div>
      </header>

      <!-- Shared 5-col body shell: aside (chapter nav, recipe only) + content area -->
      <div class="mt-2 grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-5">
        <aside
          class="hidden min-w-0 lg:col-span-1 lg:block"
          :aria-hidden="activePrimaryId !== 'recipe' ? 'true' : undefined"
        >
          <ArticleSectionNav
            v-if="showSecondaryNav"
            :slides="recipeNavSlides"
            :active-index="activeRecipeSegmentIndex"
            @update:active-index="onRecipeSegmentNavClick"
          />
        </aside>

        <div class="flex min-h-0 min-w-0 flex-col lg:col-span-4">
          <!-- Recipe: scroll stack (Summary+ → sections → map); submenu scroll-spy in script -->
          <div
            v-show="activePrimaryId === 'recipe'"
            id="article-primary-recipe"
            role="tabpanel"
            class="flex h-full min-h-0 min-w-0 flex-col"
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
              class="recipe-scroll-stack scrollbar-thin scrollbar-thumb-neutral-400 scrollbar-track-transparent min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth pb-8"
              @scroll.passive="onRecipeScrollAreaScroll"
            >
              <!-- Summary+ -->
              <section
                data-testid="article-recipe-segment-summary-plus"
                data-recipe-segment-index="0"
                class="grid min-w-0 scroll-mt-24 grid-cols-1 gap-x-8 gap-y-6 border-b border-default/15 pb-16 lg:grid-cols-3"
              >
                <div class="min-w-0 lg:col-span-3">
                  <RecipeSegmentHeading
                    :number="segmentNumber(0)"
                    :label="t('recipe.nav.summaryPlus')"
                    class="mb-0!"
                  />
                </div>
                <div class="min-w-0 lg:col-span-1">
                  <SummaryMainLeftColumn :document="document" />
                </div>
                <div class="flex min-w-0 flex-col gap-4 lg:col-span-2">
                  <SummaryMainContent :document="document" />
                  <UAlert
                    v-if="recipeSections.length === 0"
                    color="neutral"
                    variant="subtle"
                    :title="t('recipe.emptyTitle')"
                    :description="t('recipe.emptyDescription')"
                    class="max-w-prose"
                  />
                </div>
                <div class="min-w-0 lg:col-span-3">
                  <SummaryMainGallery :document="document" />
                </div>
              </section>

              <!-- Markdown sections (per-section imagery: RECIPE_SECTION_IMAGES) -->
              <section
                v-for="(section, idx) in recipeSections"
                :key="section.key"
                :data-testid="`article-recipe-segment-${section.key}`"
                :data-recipe-segment-index="1 + idx"
                :data-section-decoration="recipeSectionImage(section)?.placement ?? undefined"
                class="mb-32 flex min-w-0 flex-col border-b border-neutral-lighter pt-0 pb-16 last:border-b-0"
              >
                <div
                  class="flex min-w-0 w-full flex-col justify-center gap-10 self-center max-w-5xl"
                  
                >
                <!-- :class="
                    recipeSectionImage(section)?.placement === 'aside-left'
                      ? 'max-w-5xl'
                      : 'max-w-4xl'
                  " -->
                  <RecipeSegmentHeading
                    :number="segmentNumber(1 + idx)"
                    :label="section.title"
                  />
                  <!-- <div
                    v-if="recipeSectionImage(section)?.placement === 'aside-left'"
                    class="grid min-w-0 grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,12rem)_minmax(0,32rem)] lg:gap-x-10 xl:grid-cols-[minmax(0,14rem)_minmax(0,36rem)]"
                  >
                    <div
                      class="flex shrink-0 justify-center lg:sticky lg:top-24 lg:justify-start"
                      aria-hidden="true"
                    >
                      <img
                        :src="recipeSectionImage(section)!.src"
                        alt=""
                        :class="recipeSectionImage(section)!.imgClass"
                      >
                    </div>
                    <div class="min-w-0 md:pl-8">
                      <RecipeSectionBody :section="section" />
                    </div>
                  </div> -->

                  <div
                    
                    class="min-w-0 md:pl-12"
                  >
                    <RecipeSectionBody :section="section" />
                  </div>

                  <!-- <div
                    v-if="recipeSectionImage(section)?.placement === 'after'"
                    class="flex justify-center border-t border-default/10 pt-10"
                    aria-hidden="true"
                  >
                    <img
                      :src="recipeSectionImage(section)!.src"
                      alt=""
                      :class="recipeSectionImage(section)!.imgClass"
                    >
                  </div> -->
                </div>
                <RecipeSectionGalleryStrip
                  v-if="showSectionGalleryStrip(idx)"
                  :src="sectionGalleryStripSrc(idx)"
                  :object-position-y="sectionGalleryStripFocusY(idx)"
                />
              </section>

              <!-- Map -->
              <section
                data-testid="article-recipe-segment-map"
                :data-recipe-segment-index="mapSegmentIndex"
                class="min-w-0 scroll-mt-24 border-b border-default/15 py-16 lg:py-20"
              >
                <RecipeSegmentHeading
                  :number="segmentNumber(mapSegmentIndex)"
                  :label="t('recipe.nav.map')"
                  class="mb-6"
                />
                <div class="min-h-0 min-w-0">
                  <SummaryMapSection :document="document" />
                </div>
              </section>
            </div>
          </div>

          <!-- Chat -->
          <div
            v-show="activePrimaryId === 'chat'"
            id="article-primary-chat"
            role="tabpanel"
            class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
          >
            <ViewModeChat :document="document" />
          </div>

          <!-- Contacts -->
          <div
            v-show="activePrimaryId === 'contacts'"
            id="article-primary-contacts"
            role="tabpanel"
            class="relative h-full min-h-0 min-w-0 overflow-y-auto"
          >
            <SummaryContactsSection :document="document" />
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
import ArticlePrimaryNav from "./article/ArticlePrimaryNav.vue";
import ArticleSectionNav from "./article/ArticleSectionNav.vue";
import type { ArticleNavItem } from "./article/ArticleSectionNav.vue";
import SummaryMainLeftColumn from "./article/SummaryMainLeftColumn.vue";
import SummaryMainContent from "./article/SummaryMainContent.vue";
import SummaryMainGallery from "./article/SummaryMainGallery.vue";
import SummaryContactsSection from "./article/SummaryContactsSection.vue";
import SummaryMapSection from "./article/SummaryMapSection.vue";
import RecipeSectionBody from "./article/RecipeSectionBody.vue";
import RecipeSegmentHeading from "./article/RecipeSegmentHeading.vue";
import RecipeSectionGalleryStrip from "./article/RecipeSectionGalleryStrip.vue";
import { RecipeScrollRootKey } from "./article/recipeScrollContext";
import {
  useArticleRecipe,
  type RecipeSection,
  type RecipeSectionKey,
} from "@/composables/useArticleRecipe";

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
  }>(),
  { chrome: "modal" },
);

const { t } = useI18n();
const { isAuthenticated, promptAuthForPersistence } = useAccess();
const { pinCapture } = usePin();
const pinsApi = usePinsSupabase();

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
    activeRecipeSegmentIndex.value = 0;
  }
}

const recipeScrollRoot = ref<HTMLElement | null>(null);
provide(RecipeScrollRootKey, recipeScrollRoot);
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

const recipeNavSlides = computed<ArticleNavItem[]>(() => {
  const slides: ArticleNavItem[] = [
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

type RecipeSectionImagePlacement = "aside-left" | "after";

interface RecipeSectionImageConfig {
  placement: RecipeSectionImagePlacement;
  src: string;
  imgClass: string;
}

const RECIPE_SECTION_IMAGE_DEFAULTS = {
  after:
    "max-h-36 w-auto max-w-xs object-contain opacity-90 sm:max-w-sm md:max-h-44",
  asideLeft:
    "w-full max-w-[13rem] object-contain opacity-90 sm:max-w-[14rem] ",
} as const;

/** Add section keys here to attach recipe / compass (or other) imagery. */
const RECIPE_SECTION_IMAGES: Partial<
  Record<RecipeSectionKey, RecipeSectionImageConfig>
> = {
  context_summary: {
    placement: "aside-left",
    src: "/img/explorer/bg_image_recipe.png",
    imgClass: RECIPE_SECTION_IMAGE_DEFAULTS.asideLeft,
  },
  challenges: {
    placement: "after",
    src: "/img/explorer/full_compass.png",
    imgClass: RECIPE_SECTION_IMAGE_DEFAULTS.after,
  },
};

function recipeSectionImage(
  section: RecipeSection,
): RecipeSectionImageConfig | null {
  return RECIPE_SECTION_IMAGES[section.key] ?? null;
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

function segmentNumber(index: number): string {
  return `${String(index + 1).padStart(2, "0")}.`;
}

const SUMMARY_GALLERY_PLACEHOLDER = "/img/img_placeholder.png";

interface SummaryGalleryImage {
  public_url: string;
}

const summaryGalleryImages = computed<SummaryGalleryImage[]>(() => {
  const raw = (props.document as { images?: unknown })?.images;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (img): img is SummaryGalleryImage =>
      !!img &&
      typeof img === "object" &&
      typeof (img as SummaryGalleryImage).public_url === "string" &&
      (img as SummaryGalleryImage).public_url.length > 0,
  );
});

/** Decorative strip below segments numbered 02, 04, 06, … (even headings). */
function showSectionGalleryStrip(recipeSectionIdx: number): boolean {
  return recipeSectionIdx % 2 === 0;
}

function sectionGalleryStripSrc(recipeSectionIdx: number): string {
  const images = summaryGalleryImages.value;
  const imageIndex = Math.floor(recipeSectionIdx / 2);
  if (images.length > 0) {
    return images[imageIndex % images.length]!.public_url;
  }
  return SUMMARY_GALLERY_PLACEHOLDER;
}

/** Stable vertical crop per strip (20–80%) so repeated URLs look distinct. */
function sectionGalleryStripFocusY(recipeSectionIdx: number): number {
  const src = sectionGalleryStripSrc(recipeSectionIdx);
  let hash = recipeSectionIdx * 2654435761;
  for (let i = 0; i < src.length; i++) {
    hash = Math.imul(hash ^ src.charCodeAt(i), 16777619);
  }
  return (Math.abs(hash) % 61) + 20;
}

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
      documentPinError.value = pinsApi.error.value ?? t("pins.capture.saveFailed");
      return;
    }
    documentPinDialogOpen.value = false;
  } finally {
    documentPinSaving.value = false;
  }
}

defineExpose({
  openDocumentPinDialog: () => {
    if (!promptAuthForPersistence("pin")) return;
    documentPinError.value = null;
    documentPinDialogOpen.value = true;
  },
  isAuthenticated,
});

</script>
