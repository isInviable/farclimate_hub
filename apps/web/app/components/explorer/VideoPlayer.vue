<template>
  <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
    <div class="p-6 flex flex-col items-center">
      <div v-if="!embedded" class="w-full flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Video Summary</h3>
        <button @click="dialogStore.hideDialog()">
          <Icon name="mdi:close" size="1.5rem" />
        </button>
      </div>

      <div
        v-if="isLoading"
        class="h-[400px] w-full flex flex-col items-center justify-center space-y-4 bg-gray-50 rounded-lg"
      >
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"
        ></div>
        <p class="text-gray-600">Generating content...</p>
      </div>

      <template v-else>
        <div class="h-auto w-full bg-gray-50 p-4 rounded-lg">
          <video
            class="w-full h-full object-contain rounded-lg max-h-[60vh]"
            controls
            autoplay
            muted
            loop
          >
            <source src="/media/test_summary.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <button
          v-if="!embedded"
          class="mt-6 px-6 py-2 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Icon name="lucide:download" size="1.25rem" />
          Download Video
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
