<template>
  <div class="bg-white rounded-lg shadow-xl max-w-lg w-full">
    <div class="p-6 flex flex-col items-center">
      <div v-if="!embedded" class="w-full flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Podcast Summary</h3>
        <button @click="dialogStore.hideDialog()">
          <Icon name="mdi:close" size="1.5rem" />
        </button>
      </div>

      <div
        v-if="isLoading"
        class="h-24 w-full flex flex-col items-center justify-center space-y-4"
      >
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"
        ></div>
        <p class="text-gray-600">Generating content...</p>
      </div>

      <template v-else>
        <div
          class="h-auto w-full bg-gray-50 p-6 rounded-lg flex flex-col items-center"
        >
          <audio
            src="/media/article_podcast.mp3"
            controls
            autoplay
            class="audio-player w-80"
          ></audio>
        </div>
        <button
          v-if="!embedded"
          class="mt-6 px-6 py-2 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Icon name="lucide:download" size="1.25rem" />
          Download Podcast
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useDialogStore } from "@/stores/dialog";
const dialogStore = useDialogStore();
const props = defineProps<{ embedded?: boolean }>();

const isLoading = ref(true);

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
  }, 3000);
});
</script>

<style scoped>
.audio-player {
  background: #e5e7eb;
  border-radius: 2rem;
  outline: none;
  box-shadow: none;
  padding: 0.5rem 0;
}
</style> 