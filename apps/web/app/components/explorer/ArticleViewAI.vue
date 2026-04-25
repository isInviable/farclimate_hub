<template>
  <div class=" mx-auto py-8 space-y-6" :class="{ 'w-full': showSidebar === true, 'max-w-3xl': showSidebar === false }">
    <ArticleTextSelectionCapture source-view="article">
      <UTabs :items="tabItems" variant="link" :ui="{ trigger: 'grow' }" class="gap-4 w-full">
        <template #summary>
          <ArticleSummaryView :document="document" :parsed-document="parsedDocument" :get-section-summary="getSectionSummary" :is-loading-section="isLoadingSection" :map-points="mapPoints" />
        </template>

        <template #structured>
          <ArticleStructuredView
            :document-id="document.id"
            :recipe-ingredients="document.recipe_ingredients ?? null"
            :show-index="showSidebar !== false"
          />
        </template>

        <template #full>
          <UCard>
            <div class="p-6">
              <div
                v-if="document.fulltext"
                class="prose prose-sm max-w-none"
                v-html="md.render(document.fulltext)"
              />
              <UAlert
                v-else
                color="neutral"
                variant="subtle"
                :title="t('common.articleNoFulltext')"
              />
            </div>
          </UCard>
        </template>

        <template #chat>
          <ViewModeChat :document="document" />
        </template>
      </UTabs>
    </ArticleTextSelectionCapture>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, watch, onMounted } from "vue";
import MarkdownIt from "markdown-it";
import ArticleStructuredView from './ArticleStructuredView.vue';
import ArticleSummaryView from './ArticleSummaryView.vue';
import ArticleTextSelectionCapture from './ArticleTextSelectionCapture.vue';
import { useI18n } from 'vue-i18n';
import { PinArticleContextKey } from './pinContext';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const { locale, t } = useI18n();

const tabItems = [
  {
    label: t('tabs.summary'),
    icon: 'i-lucide-file-spreadsheet',
    slot: 'summary' as const
  },
  {
    label: t('tabs.structured'),
    icon: 'i-lucide-list-tree',
    slot: 'structured' as const
  },
  {
    label: t('tabs.full'),
    icon: 'i-lucide-file-text',
    slot: 'full' as const
  },
  {
    label: t('tabs.chat'),
    icon: 'i-lucide-message-square',
    slot: 'chat' as const
  }
]

const props = defineProps({
  document: {
    type: Object,
    required: true,
  },
  showSidebar: {
    type: Boolean,
    default: true,
  },
});

const pinDocumentUid = computed<string | null>(() => {
  const doc = props.document as { document_uid?: unknown; id?: unknown } | null | undefined;
  const uid = doc?.document_uid;
  if (typeof uid === "string" && uid.trim()) return uid;
  const id = doc?.id;
  if (typeof id === "string" && id.trim()) return id;
  return null;
});

const pinDocumentTitle = computed<string | null>(() => {
  const raw = (props.document as { title?: unknown } | null | undefined)?.title;
  return typeof raw === "string" && raw.trim() ? raw : null;
});

// Snapshot the parent document's `[lat, lon]` so nested pin entry points
// (SelectableBlock) can stamp `body.data.location` for the pinboard map.
// See change `pinboard-global-map`.
const pinDocumentLocation = computed<[number, number] | null>(() => {
  const raw = (props.document as { location?: unknown } | null | undefined)
    ?.location;
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

const sectionSummaryCache = ref(new Map());
const loadingSections = ref(new Set());

const mapPoints = computed(() => {
  if (
    props.document &&
    props.document.location &&
    Array.isArray(props.document.location) &&
    props.document.location.length === 2
  ) {
    return [
      {
        label: props.document.title,
        location: {
          lat: props.document.location[0],
          lon: props.document.location[1],
        },
        articleId: props.document.id,
      },
    ];
  }
  return [];
});

const parsedDocument = computed(() => {
  if (!props.document) return {};
  const doc = props.document;

  // Helper function to split comma-separated strings into arrays
  const splitToArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string")
      return value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v);
    return [];
  };

  return {
    sectors: doc.sectors,
    sectorsArray: splitToArray(doc.sectors),
    climate_impacts: Array.isArray(doc.climate_impacts)
      ? doc.climate_impacts.join(", ")
      : "",
    hazardsArray: splitToArray(doc.climate_impacts),
    implementation_years: `${doc.implementation_years?.start_year || "N/A"} - ${
      doc.implementation_years?.end_year || "N/A"
    }`,
    adaptation_approaches: Array.isArray(doc.adaptation_approaches)
      ? doc.adaptation_approaches.join(", ")
      : "",
    adaptationApproachesArray: splitToArray(doc.adaptation_approaches),
    location: Array.isArray(doc.location)
      ? `${doc.location[0].toFixed(2)}, ${doc.location[1].toFixed(2)}`
      : doc.geographic_characterisation?.city ||
        doc.geographic_characterisation?.countries ||
        "N/A",
    keywords: Array.isArray(doc.keywords) ? doc.keywords.join(", ") : "",
    keywordsArray: splitToArray(doc.keywords),
    cost_benefit: md.render(doc.cost_benefit || ""),
  };
});

// Helper functions for AI summaries
function isLoadingSection(section: string) {
  return loadingSections.value.has(section);
}

function getSectionSummary(section: string) {
  const cacheKey = `${props.document.id}-${section}`;
  return sectionSummaryCache.value.get(cacheKey)?.response;
}

async function fetchSectionSummary(section: string, text: string) {
  if (!text) return;

  const cacheKey = `${props.document.id}-${section}`;

  // Skip if we already have this summary
  if (sectionSummaryCache.value.has(cacheKey)) {
    return;
  }

  loadingSections.value.add(section);

  try {
    const response = await $fetch("/api/summarizeSection", {
      method: "POST",
      body: {
        text,
        section,
        cacheId: cacheKey,
      },
    });

    sectionSummaryCache.value.set(cacheKey, response);
  } catch (error) {
    console.error(`Error fetching ${section} summary:`, error);
  } finally {
    loadingSections.value.delete(section);
  }
}

// Trigger AI summaries when component mounts or document changes
onMounted(async () => {
  if (props.document) {
    // Fetch AI summaries for applicable sections
    if (props.document.stakeholder_participation) {
      await fetchSectionSummary(
        "who_is_involved",
        props.document.stakeholder_participation
      );
    }
    if (props.document.cost_benefit) {
      await fetchSectionSummary("economic_data", props.document.cost_benefit);
    }
  }
});

// Watch for document changes to fetch new summaries
watch(
  () => props.document,
  async (newDocument) => {
    if (newDocument) {
      if (newDocument.stakeholder_participation) {
        await fetchSectionSummary(
          "who_is_involved",
          newDocument.stakeholder_participation
        );
      }
      if (newDocument.cost_benefit) {
        await fetchSectionSummary("economic_data", newDocument.cost_benefit);
      }
    }
  },
  { immediate: false }
);
</script>

<!-- Nuevo componente para bloques seleccionables y pineables -->
<!-- components/ui/SelectableBlock.vue -->

<!--
<template>
  <div
    class="relative group cursor-pointer transition-all duration-200"
    :class="{
      'ring-2 ring-blue-500 shadow-lg': isSelected,
      'hover:ring-2 hover:ring-blue-300 hover:shadow-md': !isSelected
    }"
    @click="toggleSelected"
    tabindex="0"
    :aria-pressed="isSelected"
  >
    <div class="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
      <Icon :name="icon" class="text-xl text-gray-500" />
      <div class="flex-1">
        <div class="font-mono text-xs text-gray-500 mb-1">{{ label }}</div>
        <div v-if="isHtml" v-html="value" class="text-sm" />
        <a v-else-if="isLink && value" :href="value" target="_blank" class="text-blue-600 underline text-sm">{{ value }}</a>
        <div v-else class="text-sm"> <slot>{{ value }}</slot> </div>
      </div>
      <Pin v-show="isHovered" class="ml-2" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Pin } from '@/components/ui/pin';

const props = defineProps({
  label: String,
  value: [String, Number],
  icon: String,
  isHtml: Boolean,
  isLink: Boolean
});

const isSelected = ref(false);
const isHovered = ref(false);

function toggleSelected() {
  isSelected.value = !isSelected.value;
}
</script>
-->

<style scoped>
/* Mejoras visuales para los bloques seleccionables */
</style>
