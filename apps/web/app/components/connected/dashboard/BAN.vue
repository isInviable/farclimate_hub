<script setup>
import BANDetail from "./BANDetail.vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  formatter: {
    type: Function,
    default: (d) => new Intl.NumberFormat("en-US").format(d),
  },
  showDownloadBtn: {
    type: Boolean,
    default: false,
  },
  items: {
    type: Array,
    default: () => [],
  },
});

const slideoverOpen = ref(false);
const formattedValue = computed(() => props.formatter(props.value));
</script>

<template>
  <div class="relative h-full bg-white border-gray-50 border-2 flex flex-col p-12">
    <!-- Title section -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-[2.75em] font-light text-black">
        {{ props.title }}
      </h2>
      <!-- Arrow icon -->
      <button
        v-if="props.items.length > 0"
        @click="slideoverOpen = true"
        class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer border-0 p-0 shrink-0"
        type="button"
        aria-label="View details"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-gray-600"
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Dashed horizontal line -->
    <div class="border-t border-dashed border-gray-300 mb-8"></div>

    <!-- Big number -->
    <div class="flex-1 flex items-start">
      <span class="text-8xl font-bold text-black">
        {{ formattedValue }}
      </span>
    </div>

    <!-- Slideover -->
    <USlideover v-model:open="slideoverOpen" :title="props.title">
      <template #body>
        <BANDetail :type="props.title" :items="props.items" :formatter="props.formatter" />
      </template>
    </USlideover>
  </div>
</template>
