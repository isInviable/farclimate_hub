<template>
  <section class="relative p-4">
    <!-- Map container -->
    <div class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div v-if="mapPoints.length > 0" class="h-[70vh] w-full">
        <MapBase :points="mapPoints" @pinClick="handlePinClick" :fitToBounds="true" />
      </div>
      <div v-else class="flex flex-col items-center justify-center py-16 text-gray-500">
        <Icon name="mdi:map-outline" class="w-12 h-12 text-gray-300 mb-3" />
        <p class="text-lg font-medium">No locations to display</p>
        <p class="text-sm">Search results don't contain geographic data</p>
      </div>
    </div>
    
    <!-- Map actions -->
    <div v-if="mapPoints.length > 0" class="flex justify-start gap-4 mt-4 pt-4 border-t border-gray-200">
      <button class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
        <Icon name="mdi:download" class="w-4 h-4" />
        <span class="text-sm">Download PNG</span>
      </button>
      <button class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
        <Icon name="mdi:share-variant" class="w-4 h-4" />
        <span class="text-sm">Share Map</span>
      </button>
      <button class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
        <Icon name="mdi:fullscreen" class="w-4 h-4" />
        <span class="text-sm">Fullscreen</span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import MapBase from '@/components/MapBase.vue';

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['document-selected']);

const mapPoints = computed(() => {
  if (!props.results) return [];
  return props.results
    .filter(hit => hit.document && hit.document.location && Array.isArray(hit.document.location) && hit.document.location.length === 2)
    .map(hit => ({
      label: hit.document.title || 'Unnamed Location',
      location: {
        lat: hit.document.location[0],
        lon: hit.document.location[1],
      },
      articleId: hit.id
    }));
});

function handlePinClick(articleId) {
  const hit = props.results.find(h => h.id === articleId);
  if (hit) {
    emit('document-selected', hit.document);
  }
}
</script>

<style scoped>
.side-panel-enter-active,
.side-panel-leave-active {
  transition: transform 0.3s ease;
}

.side-panel-enter-from,
.side-panel-leave-to {
  transform: translateX(-100%);
}
</style> 