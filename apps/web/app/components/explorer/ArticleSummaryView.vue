<template>
  <div>
    <!-- Existing summary view -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Short description with images/video -->
      <SelectableBlock
        :label="$t('summaryHeaders.shortDescription')"
        icon="mdi:comment-text-outline"
        class="col-span-2"
      >
        <div class="flex gap-2 mb-3">
          <img
            :src="document.image_url || '/img/img_placeholder.png'"
            alt="article image"
            class="aspect-video h-32 rounded border object-cover"
          />
          <img
            src="/img/video_placeholder.png"
            alt="video placeholder"
            class="aspect-video h-32 rounded border object-cover"
          />
        </div>
        <p class="text-sm text-gray-700">{{ document.subtitle }}</p>
      </SelectableBlock>
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
              class="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-2"
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
              class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-2"
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
    </div>
  </div>
</template>

<script setup>
import SelectableBlock from "~/components/SelectableBlock";
import MapBase from "~/components/MapBase";
import MarkdownIt from "markdown-it";
import { useI18n } from "vue-i18n";

const { t: $t } = useI18n();

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const props = defineProps({
  document: { type: Object, required: true },
  parsedDocument: { type: Object, required: true },
  getSectionSummary: { type: Function, required: true },
  isLoadingSection: { type: Function, required: true },
  mapPoints: { type: Array, required: true },
});
</script>
