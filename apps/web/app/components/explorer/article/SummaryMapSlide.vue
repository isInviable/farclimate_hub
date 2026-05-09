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
import { useI18n } from "vue-i18n";
import MapBase from "../MapBase.vue";

interface MapPoint {
  label?: string;
  location: { lat: number; lon: number };
  articleId?: string | number;
}

defineProps<{
  mapPoints: MapPoint[];
}>();

const { t: $t } = useI18n();
</script>
