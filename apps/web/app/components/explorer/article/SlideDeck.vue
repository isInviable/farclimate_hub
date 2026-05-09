<template>
  <div class="slide-deck relative flex flex-col h-full min-h-0">
    <!-- Slide viewport (secondary chrome lives in ArticleViewAI header) -->
    <div class="slide-deck-viewport relative flex-1 min-h-0">
      <div
        class="slide-deck-track flex w-full transition-transform duration-200 ease-out"
        :style="trackStyle"
      >
        <section
          v-for="(slide, idx) in slides"
          :id="`${panelId}-${slide.id}`"
          :key="slide.id"
          class="slide-panel relative shrink-0 w-full overflow-y-auto"
          :aria-hidden="idx !== activeIndex"
          :tabindex="idx === activeIndex ? 0 : -1"
        >
          <div class="relative  px-1 pt-1 pb-6 md:px-2">
            <div class="relative min-h-full">
              <slot :name="slide.id" :slide="slide" :index="idx" />
            </div>

            <DecorativeCorner
              v-if="!decorationContext && slide.decoration"
              :src="slide.decoration.src"
              :corner="slide.decoration.corner"
              :size-class="slide.decoration.sizeClass"
            />
          </div>
        </section>
      </div>
    </div>

    <UButton
      icon="i-lucide-chevron-left"
      color="primary"
      variant="outline"
      size="xl"
      :ui="{ base: 'rounded-full' }"
      class="absolute! left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 size-12 shadow-md z-10"
      :aria-label="prevAriaLabel"
      :disabled="activeIndex <= 0"
      :aria-disabled="activeIndex <= 0 ? 'true' : undefined"
      @click="prev"
    />
    <UButton
      icon="i-lucide-chevron-right"
      color="primary"
      variant="outline"
      size="xl"
      :ui="{ base: 'rounded-full' }"
      class="absolute! right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-12 shadow-md z-10"
      :aria-label="nextAriaLabel"
      :disabled="activeIndex >= slides.length - 1"
      :aria-disabled="activeIndex >= slides.length - 1 ? 'true' : undefined"
      @click="next"
    />

    <div class="sr-only" aria-live="polite">
      <template v-if="activeSlideLabel">
        {{ activeIndex + 1 }} / {{ slides.length }} — {{ activeSlideLabel }}
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onUnmounted, watch } from "vue";
import DecorativeCorner from "./DecorativeCorner.vue";
import {
  ArticleDecorationContextKey,
  type ArticleDecoration,
} from "./articleDecorationContext";

export interface Slide {
  id: string;
  label: string;
  decoration?: ArticleDecoration;
}

const props = withDefaults(
  defineProps<{
    slides: Slide[];
    activeIndex: number;
    panelId?: string;
    prevAriaLabel?: string;
    nextAriaLabel?: string;
  }>(),
  {
    panelId: "slide",
    prevAriaLabel: "Previous slide",
    nextAriaLabel: "Next slide",
  },
);

const emit = defineEmits<{
  (e: "update:activeIndex", index: number): void;
}>();

const decorationContext = inject(ArticleDecorationContextKey, null);
const decorationSource = Symbol("SlideDeckDecoration");

const trackStyle = computed(() => ({
  transform: `translateX(-${props.activeIndex * 100}%)`,
}));

const activeSlideDecoration = computed<ArticleDecoration | null>(
  () => props.slides[props.activeIndex]?.decoration ?? null,
);

const activeSlideLabel = computed<string>(
  () => props.slides[props.activeIndex]?.label ?? "",
);

watch(
  activeSlideDecoration,
  (decoration) => {
    if (!decorationContext) return;
    if (decoration) {
      decorationContext.setDecoration(decorationSource, decoration);
    } else {
      decorationContext.clearDecoration(decorationSource);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  decorationContext?.clearDecoration(decorationSource);
});

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

function prev(): void {
  goTo(props.activeIndex - 1);
}

function next(): void {
  goTo(props.activeIndex + 1);
}
</script>
