<template>
  <div class="summary-main-content flex flex-col gap-5 min-w-0">
    <div class="block 2xl:grid grid-cols-4 gap-4">
    <CapturableBlock
      v-if="document?.subtitle"
      :label="$t('summaryHeaders.shortDescription')"
      icon="mdi:comment-text-outline"
      :chrome="false"
      :capture-enabled="false"
      class="col-span-3"
    >
      <p class="text-xl text-default leading-relaxed font-medium max-w-3xl
      ">
        {{ document.subtitle }}
      </p>
    </CapturableBlock>
      <div v-if="externalSourceUrl" class="pt-2">
      <UButton
        :to="externalSourceUrl"
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        color="primary"
        icon="i-lucide-external-link"
        :label="$t('article.viewOnClimateAdapt')"
      />
      <p class="text-xs text-muted mt-1">
        {{ $t("article.sourceLinkHint") }}
      </p>
    </div>
    </div>
    

    <div v-if="parsedDocument.sectorsArray?.length">
      <p class="font-mono text-xs text-muted uppercase tracking-wide mb-1">
        {{ $t("summaryHeaders.sector") }}
      </p>
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="sector in parsedDocument.sectorsArray"
          :key="sector"
          color="secondary"
          variant="solid"
          size="md"
          class="rounded-none px-3"
          :label="sector.trim()"
        />
      </div>
    </div>

    <div v-if="parsedDocument.hazardsArray?.length">
      <p class="font-mono text-xs text-muted uppercase tracking-wide mb-1">
        {{ $t("summaryHeaders.hazards") }}
      </p>
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="hazard in parsedDocument.hazardsArray"
          :key="hazard"
          color="error"
          variant="solid"
          size="md"
          class="rounded-none px-3"
          :label="hazard.trim()"
        />
      </div>
    </div>

    <div v-if="parsedDocument.adaptationApproachesArray?.length">
      <p class="font-mono text-xs text-muted uppercase tracking-wide mb-1">
        {{ $t("summaryHeaders.typeOfSolution") }}
      </p>
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="approach in parsedDocument.adaptationApproachesArray"
          :key="approach"
          color="warning"
          variant="solid"
          size="md"
          class="rounded-none px-3"
          :label="approach.trim()"
        />
      </div>
    </div>

    <div v-if="parsedDocument.keywordsArray?.length">
      <p class="font-mono text-xs text-muted uppercase tracking-wide mb-1">
        {{ $t("summaryHeaders.keywords") }}
      </p>
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="keyword in parsedDocument.keywordsArray"
          :key="keyword"
          color="neutral"
          variant="solid"
          size="md"
          class="rounded-none px-3"
          :label="keyword.trim()"
        />
      </div>
    </div>

  
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CapturableBlock from "../CapturableBlock.vue";

interface ParsedDocument {
  sectorsArray?: string[];
  hazardsArray?: string[];
  adaptationApproachesArray?: string[];
  keywordsArray?: string[];
}

const props = defineProps<{
  document: Record<string, unknown> & {
    subtitle?: string;
    source_url?: string | null;
  };
  parsedDocument: ParsedDocument;
}>();

const externalSourceUrl = computed<string | null>(() => {
  const raw = props.document?.source_url;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
});
</script>
