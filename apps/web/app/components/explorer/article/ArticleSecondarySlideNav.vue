<template>
  <nav
    aria-label="Slide sections"
    class="article-secondary-nav flex flex-wrap items-baseline gap-x-6 gap-y-1"
  >
    <button
      v-for="(slide, idx) in slides"
      :key="slide.id"
      type="button"
      :aria-current="idx === activeIndex ? 'true' : undefined"
      class="font-mono text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm"
      :class="
        idx === activeIndex
          ? 'text-black font-semibold cursor-default'
          : 'text-neutral-600 hover:text-neutral-700 cursor-pointer'
      "
      @click="goTo(idx)"
    >
      {{ idx + 1 }}. {{ slide.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { Slide } from "./SlideDeck.vue";

const props = defineProps<{
  slides: readonly Slide[];
  activeIndex: number;
}>();

const emit = defineEmits<{
  (e: "update:activeIndex", index: number): void;
}>();

function clamp(idx: number): number {
  if (props.slides.length === 0) return 0;
  if (idx < 0) return 0;
  if (idx >= props.slides.length) return props.slides.length - 1;
  return idx;
}

function goTo(idx: number): void {
  const next = clamp(idx);
  if (next === props.activeIndex) return;
  emit("update:activeIndex", next);
}
</script>
