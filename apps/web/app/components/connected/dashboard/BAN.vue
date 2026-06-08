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
  accent: {
    type: String,
    default: "#1e63a2",
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
  <div
    class="group relative flex h-full flex-col border border-neutral-darkest bg-neutral-lightest p-6 transition-colors"
    :style="{ '--ca-accent': props.accent }"
  >
    <!-- Title row -->
    <div class="mb-1 flex items-center justify-between">
      <span class="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-dark">
        {{ props.title }}
      </span>
      <!-- Arrow icon -->
      <button
        v-if="props.items.length > 0"
        class="inline-flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-darkest p-0 transition-colors hover:border-[var(--ca-accent)] hover:bg-[var(--ca-accent)] hover:text-neutral-lightest"
        type="button"
        aria-label="View details"
        @click="slideoverOpen = true"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Big number -->
    <div class="flex flex-1 items-end">
      <span class="font-display text-7xl font-bold" :style="{ color: props.accent }">
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
