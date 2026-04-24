<template>
  <div>
    <!-- Existing summary view -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Short description -->
      <SelectableBlock
        :label="$t('summaryHeaders.shortDescription')"
        icon="mdi:comment-text-outline"
        class="col-span-2"
      >
        <p class="text-sm text-gray-700">{{ document.subtitle }}</p>
      </SelectableBlock>

      <!-- Original case study URL (e.g. Climate-ADAPT) -->
      <div
        v-if="externalSourceUrl"
        class="col-span-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
      >
        <UButton
          :to="externalSourceUrl"
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          color="primary"
          icon="i-lucide-external-link"
          :label="$t('article.viewOnClimateAdapt')"
        />
        <p class="text-xs text-gray-500">
          {{ $t("article.sourceLinkHint") }}
        </p>
      </div>

      <!-- Images: all URLs + per-image pin + lightbox -->
      <div
        v-if="galleryImages.length"
        class="col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <SelectableBlock
          v-for="(img, index) in galleryImages"
          :key="img.public_url"
          :label="img.title || $t('article.imageNumber', { n: index + 1 })"
          icon="mdi:image-outline"
          pin-kind="image"
          class="min-w-0"
        >
          <button
            type="button"
            class="block w-full cursor-zoom-in rounded border-0 bg-transparent p-0 text-left overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            :aria-label="$t('article.openImageLightbox')"
            @click.stop="openLightbox(img, index)"
          >
            <img
              :src="img.public_url"
              :alt="img.title || $t('article.imageAlt', { n: index + 1 })"
              class="aspect-video h-32 w-full rounded border border-gray-200 object-cover"
            />
          </button>
        </SelectableBlock>
      </div>
      <div
        v-else
        class="col-span-2 flex flex-col gap-3 rounded-md border border-dashed border-gray-200 bg-gray-50/50 p-4 sm:flex-row sm:items-center"
      >
        <img
          src="/img/img_placeholder.png"
          alt=""
          class="aspect-video h-32 w-full max-w-xs shrink-0 rounded border border-gray-200 object-cover opacity-80"
        />
        <p class="text-sm text-gray-500">{{ $t("article.noImagesInGallery") }}</p>
      </div>

      <AppImageLightbox
        v-model:open="lightboxOpen"
        :src="lightboxSrc"
        :alt="lightboxAlt"
        :title="lightboxTitle"
        :description="lightboxDescription"
        :credits="lightboxCredits"
      />
      <!-- SECTOR -->
      <SelectableBlock
        :label="$t('summaryHeaders.sector')"
        icon="mdi:tree-outline"
      >
        <div class="flex flex-wrap gap-2">
          <span
            v-for="sector in parsedDocument.sectorsArray"
            :key="sector"
            class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
          >
            {{ sector.trim() }}
          </span>
        </div>
      </SelectableBlock>
      <!-- DATE -->
      <SelectableBlock
        :label="$t('summaryHeaders.date')"
        :value="parsedDocument.implementation_years"
        icon="mdi:calendar-range"
      />
      <!-- HAZARDS -->
      <SelectableBlock
        :label="$t('summaryHeaders.hazards')"
        icon="mdi:weather-lightning-rainy"
      >
        <div class="flex flex-wrap gap-2">
          <span
            v-for="hazard in parsedDocument.hazardsArray"
            :key="hazard"
            class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
          >
            {{ hazard.trim() }}
          </span>
        </div>
      </SelectableBlock>
      <!-- TYPE OF SOLUTION -->
      <SelectableBlock
        :label="$t('summaryHeaders.typeOfSolution')"
        icon="mdi:lightbulb-on-outline"
      >
        <div class="flex flex-wrap gap-2">
          <span
            v-for="approach in parsedDocument.adaptationApproachesArray"
            :key="approach"
            class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
          >
            {{ approach.trim() }}
          </span>
        </div>
      </SelectableBlock>
      <!-- WHO IS INVOLVED -->
      <SelectableBlock
        :label="$t('summaryHeaders.whoIsInvolved')"
        icon="mdi:account-group-outline"
        :showAiIcon="!!getSectionSummary('who_is_involved')"
      >
        <div
          v-if="isLoadingSection('who_is_involved')"
          class="flex items-center justify-center py-4"
        >
          <div
            class="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-500"
          ></div>
          <span class="ml-2 text-sm text-gray-500"
            >Analyzing stakeholders...</span
          >
        </div>
        <div v-else-if="getSectionSummary('who_is_involved')" class="space-y-2">
          <div
            v-for="item in getSectionSummary('who_is_involved').items"
            :key="item.label"
            class="flex items-start gap-2"
          >
            <div
              class="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-2"
            ></div>
            <div>
              <span class="font-medium text-sm text-gray-900"
                >{{ item.label }}:</span
              >
              <span class="text-sm text-gray-700 ml-1">{{
                item.description
              }}</span>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-gray-700">
          {{ document.stakeholder_participation }}
        </p>
      </SelectableBlock>
      <!-- GEOGRAPHICAL SCOPE -->
      <SelectableBlock
        :label="$t('summaryHeaders.geographicalScope')"
        icon="mdi:map-marker-radius-outline"
        class="relative"
      >
        <MapBase
          v-if="mapPoints.length > 0"
          :points="mapPoints"
          :fitToBounds="false"
          class="min-h-[256px] w-full h-full"
        />
      </SelectableBlock>
    </div>
    <!-- Economic data -->
    <div class="flex flex-col gap-6 mt-6">
      <SelectableBlock
        :label="$t('summaryHeaders.economicData')"
        icon="mdi:currency-eur"
        :showAiIcon="!!getSectionSummary('economic_data')"
      >
        <div
          v-if="isLoadingSection('economic_data')"
          class="flex items-center justify-center py-4"
        >
          <div
            class="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-500"
          ></div>
          <span class="ml-2 text-sm text-gray-500"
            >Processing economic data...</span
          >
        </div>
        <div v-else-if="getSectionSummary('economic_data')" class="space-y-2">
          <div
            v-for="item in getSectionSummary('economic_data').items"
            :key="item.label"
            class="flex items-start gap-2"
          >
            <div
              class="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0 mt-2"
            ></div>
            <div>
              <span class="font-medium text-sm text-gray-900"
                >{{ item.label }}:</span
              >
              <span
                class="text-sm text-gray-700 ml-1"
                v-html="md.render(item.description)"
              ></span>
            </div>
          </div>
        </div>
        <div
          v-else-if="parsedDocument.cost_benefit"
          v-html="md.render(parsedDocument.cost_benefit)"
          class="text-sm"
        ></div>
        <p v-else class="text-sm text-gray-500">No economic data available</p>
      </SelectableBlock>
      <!-- Reference information -->
      <SelectableBlock
        :label="$t('summaryHeaders.contactPersons')"
        icon="mdi:account-box-outline"
        pin-kind="contact"
      >
        <div
          v-if="document.contact"
          v-html="md.render(document.contact)"
          class="text-sm"
        />
        <div v-else class="text-sm text-gray-500">
          No contact information available
        </div>
      </SelectableBlock>
      <SelectableBlock
        :label="$t('summaryHeaders.websites')"
        :value="document.websites?.url"
        icon="mdi:web"
        is-link
        pin-kind="website"
      />
      <SelectableBlock
        :label="$t('summaryHeaders.scientificReferences')"
        icon="mdi:book-open-outline"
      >
        <div
          v-if="document.references"
          v-html="md.render(document.references)"
          class="text-sm"
        />
        <div v-else class="text-sm text-gray-500">
          No scientific references available
        </div>
      </SelectableBlock>
      <!-- Keywords -->
      <SelectableBlock
        :label="$t('summaryHeaders.keywords')"
        icon="mdi:tag-outline"
      >
        <div class="flex flex-wrap gap-2">
          <span
            v-for="keyword in parsedDocument.keywordsArray"
            :key="keyword"
            class="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
          >
            {{ keyword.trim() }}
          </span>
        </div>
      </SelectableBlock>

      <SelectableBlock
        v-if="geographicEntries.length > 0"
        label="Geographic characterisation"
        icon="mdi:map-marker-multiple-outline"
      >
        <div class="space-y-3">
          <div
            v-for="entry in geographicEntries"
            :key="entry.key"
            class="rounded-md border border-gray-200 p-3 bg-gray-50/40"
          >
            <div class="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
              {{ entry.label }}
            </div>

            <pre
              v-if="entry.isComplex"
              class="text-xs font-mono text-gray-700 whitespace-pre-wrap wrap-break-word"
            >{{ entry.values[0] }}</pre>

            <div v-else class="flex flex-wrap gap-2">
              <span
                v-for="value in entry.values"
                :key="`${entry.key}-${value}`"
                class="bg-white border border-gray-200 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full"
              >
                {{ value }}
              </span>
            </div>
          </div>
        </div>
      </SelectableBlock>
    </div>
  </div>
</template>

<script setup>
import SelectableBlock from "./SelectableBlock.vue";
import MapBase from "./MapBase.vue";
import MarkdownIt from "markdown-it";
import { useI18n } from "vue-i18n";

const { t: $t } = useI18n();

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const lightboxOpen = ref(false);
const lightboxSrc = ref("");
const lightboxAlt = ref("");
const lightboxTitle = ref(null);
const lightboxDescription = ref(null);
const lightboxCredits = ref(null);

const props = defineProps({
  document: { type: Object, required: true },
  parsedDocument: { type: Object, required: true },
  getSectionSummary: { type: Function, required: true },
  isLoadingSection: { type: Function, required: true },
  mapPoints: { type: Array, required: true },
});

/**
 * Ordered list of images from `knowledge.document_images` (hero at position 0
 * + gallery). Filters out entries without a usable public URL so the template
 * can rely on `img.public_url` everywhere.
 */
const galleryImages = computed(() => {
  const raw = props.document?.images;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (img) => img && typeof img.public_url === "string" && img.public_url.length > 0,
  );
});

/** `source_url` from `knowledge.documents` when it is a usable http(s) URL. */
const externalSourceUrl = computed(() => {
  const raw = props.document?.source_url;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
});

function openLightbox(img, index) {
  lightboxSrc.value = img.public_url;
  lightboxAlt.value = img.title || $t("article.imageAlt", { n: index + 1 });
  lightboxTitle.value = img.title || null;
  lightboxDescription.value = img.description || null;
  lightboxCredits.value = img.credits || null;
  lightboxOpen.value = true;
}

const preferredGeoKeyOrder = [
  "city",
  "sub_nationals",
  "countries",
  "continent",
  "biogeographical_regions",
  "macro_transnational_region",
];

const formatGeoLabel = (key) =>
  key
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeGeoValues = (value) => {
  if (value === null || value === undefined) return [];

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    const split = trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    return split.length ? [...new Set(split)] : [];
  }

  if (Array.isArray(value)) {
    const flattened = value
      .flatMap((item) => {
        if (item === null || item === undefined) return [];
        if (typeof item === "string") {
          return item.split(",").map((part) => part.trim()).filter(Boolean);
        }
        return String(item).trim();
      })
      .map((item) => String(item).trim())
      .filter(Boolean);
    return flattened.length ? [...new Set(flattened)] : [];
  }

  if (typeof value === "object") {
    if (Object.keys(value).length === 0) return [];
    return [JSON.stringify(value, null, 2)];
  }

  const normalized = String(value).trim();
  return normalized ? [normalized] : [];
};

const geographicEntries = computed(() => {
  const geo = props.document?.geographic_characterisation;
  if (!geo || typeof geo !== "object" || Array.isArray(geo)) return [];

  return Object.entries(geo)
    .map(([key, value]) => {
      const values = normalizeGeoValues(value);
      return {
        key,
        label: formatGeoLabel(key),
        values,
        isComplex: typeof value === "object" && value !== null && !Array.isArray(value),
      };
    })
    .filter((entry) => entry.values.length > 0)
    .sort((a, b) => {
      const aIndex = preferredGeoKeyOrder.indexOf(a.key);
      const bIndex = preferredGeoKeyOrder.indexOf(b.key);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.label.localeCompare(b.label);
    });
});
</script>
