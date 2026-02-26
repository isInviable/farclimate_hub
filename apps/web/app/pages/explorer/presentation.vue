<template>
  <div class="bg-gray-100 min-h-screen flex flex-col">
    <div class="bg-neutral">
      <div class="w-11/12 lg:w-10/12 mx-auto py-2">
        <NuxtLink
          to="/explorer/board"
          class="text-primary-400 hover:text-primary-300 flex items-center gap-2 text-sm"
        >
          <UIcon name="i-heroicons-arrow-left" />
          Back to board
        </NuxtLink>
      </div>
    </div>


    <!-- Presentation Header -->
    <header
      class="bg-white shadow-md py-4 px-8 flex justify-between items-center"
    >
      <div class="w-11/12 lg:w-10/12 mx-auto">
        <h1 class="text-xl font-bold text-gray-800">Presentation</h1>
        <div class="flex items-center gap-4">
          <button class="bg-primary-400 text-white px-4 py-2 rounded-md">
            Download as PowerPoint
          </button>
        </div>
      </div>
    </header>

    <!-- Slide Container -->
    <main class="flex-grow flex items-center justify-center p-8 relative">
      <!-- Previous Button -->
      <button
        @click="prevSlide"
        :disabled="currentSlideIndex === 0"
        class="absolute left-8 p-2 rounded-full bg-white shadow-md disabled:opacity-50"
      >
        <Icon name="mdi:chevron-left" size="2rem" />
      </button>

      <!-- Slide Content -->
      <div class="w-full max-w-5xl flex flex-col items-center">
        <!-- Fixed Aspect Ratio Slide -->
        <div
          class="w-full bg-white p-8 rounded-lg shadow-xl"
          style="aspect-ratio: 16 / 9"
        >
          <div v-if="currentItem" class="flex flex-col h-full">
            <!-- Slide Title -->
            <h2 class="text-3xl font-bold text-gray-800 mb-6 flex-shrink-0">
              {{ currentItem.title }}
            </h2>

            <!-- Dynamically rendered component -->
            <div class="flex-grow overflow-y-auto pr-2">
              <div v-if="currentItem.type === 'text'">
                <p class="text-gray-700 leading-relaxed text-2xl">
                  {{ currentItem.data.content }}
                </p>
              </div>
              <div v-else-if="currentItem.type === 'map'">
                <div class="h-full w-full">
                  <MapBase :points="currentItem.data.points" />
                </div>
              </div>
              <div v-else-if="currentItem.type === 'chart'">
                <ImplementationYearsChart :results="currentItem.data.results" />
              </div>
              <div v-else-if="currentItem.type === 'article'">
                <ArticleView :document="currentItem.data.document" />
              </div>
              <div v-else-if="currentItem.type === 'image'">
                <img
                  :src="currentItem.data.src"
                  :alt="currentItem.data.alt"
                  class="w-full h-full object-contain"
                />
              </div>
              <div v-else-if="currentItem.type === 'bars'">
                <DummyBars :elements="currentItem.data.elements" />
              </div>
            </div>
            <!-- Notes Textarea -->
            <div class="w-full flex-shrink-0 pt-4">
              <h4 class="font-semibold text-lg text-gray-700 mb-2">Notes</h4>
              <textarea
                class="w-full h-24 p-2 border border-gray-300 rounded-md"
                placeholder="Add your notes for this slide..."
              ></textarea>
            </div>
          </div>
        </div>
        <!-- Slide Number -->
        <div v-if="currentItem" class="mt-4 text-sm text-gray-600">
          Slide {{ currentSlideIndex + 1 }} of {{ presentationItems.length }}
        </div>
      </div>

      <!-- Next Button -->
      <button
        @click="nextSlide"
        :disabled="currentSlideIndex === presentationItems.length - 1"
        class="absolute right-8 p-2 rounded-full bg-white shadow-md disabled:opacity-50"
      >
        <Icon name="mdi:chevron-right" size="2rem" />
      </button>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useMySpaceStore } from "@/stores/mySpace";
import { usePinnedSelectionStore } from "@/stores/selection";

const mySpaceStore = useMySpaceStore();
const selectionStore = usePinnedSelectionStore();

const presentationItems = computed(() => {
  if (selectionStore.selectionCount > 0) {
    return selectionStore.selectedItems;
  }
  return mySpaceStore.spaceItems;
});

const currentSlideIndex = ref(0);
const currentItem = computed(
  () => presentationItems.value[currentSlideIndex.value]
);

const nextSlide = () => {
  if (currentSlideIndex.value < presentationItems.value.length - 1) {
    currentSlideIndex.value++;
  }
};

const prevSlide = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--;
  }
};
</script>
