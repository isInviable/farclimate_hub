<template>
  <div class="flex flex-col h-full min-h-0">
    <div v-if="mapPoints.length > 0" class="flex-1 min-h-0">
      <MapBase
        :points="mapPoints"
        :fit-to-bounds="false"
        class="w-full h-full min-h-[320px] rounded-md overflow-hidden border border-default"
      />
    </div>
    <div
      v-else
      class="flex-1 flex items-center justify-center min-h-[320px] rounded-md border border-dashed border-default bg-elevated/40"
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
  const loc = props.document?.location;
  if (
    !Array.isArray(loc) ||
    loc.length !== 2 ||
    typeof loc[0] !== "number" ||
    typeof loc[1] !== "number"
  ) {
    return [];
  }
  return [
    {
      label: typeof props.document?.title === "string" ? props.document.title : "",
      location: { lat: loc[0], lon: loc[1] },
      articleId: props.document?.id,
    },
  ];
});
</script>
