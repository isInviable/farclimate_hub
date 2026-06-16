<template>
  <div>
    <div v-if="mapPoints.length > 0" class="h-[min(70vh,480px)] min-h-[320px] w-full">
      <MapBase
        :points="mapPoints"
        :fit-to-bounds="false"
        class="h-full w-full rounded-md overflow-hidden border border-default"
      />
    </div>
    <div
      v-else
      class="flex min-h-[320px] items-center justify-center rounded-md border border-dashed border-default bg-elevated/40"
    >
      <UAlert
        color="neutral"
        variant="subtle"
        icon="i-lucide-map-off"
        :title="$t('article.map.emptyTitle')"
        :description="$t('article.map.emptyDescription')"
        class="max-w-md"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import MapBase from "../MapBase.vue";
import { parseDocumentLatLon } from "@/utils/explorerBioregions";

interface MapPoint {
  label?: string;
  location: { lat: number; lon: number };
  articleId?: string | number;
}

const props = defineProps<{
  document: Record<string, unknown> & {
    title?: string;
    location?: unknown;
    id?: string | number;
  };
}>();

const { t: $t } = useI18n();

const mapPoints = computed<MapPoint[]>(() => {
  const coords = parseDocumentLatLon(props.document?.location);
  if (!coords) return [];
  return [
    {
      label: typeof props.document?.title === "string" ? props.document.title : "",
      location: coords,
      articleId: props.document?.id,
    },
  ];
});
</script>
