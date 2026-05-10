<template>
  <div class="slide-deck relative flex flex-col h-full min-h-0">
    <!-- Slide viewport (secondary chrome lives in ArticleViewAI header) -->
    <div
      ref="viewport"
      class="slide-deck-viewport  scrollbar scrollbar-thumb-neutral-darkest scrollbar-track-white relative flex-1 min-h-0 overflow-y-auto snap-y snap-proximity scroll-smooth"
      @scroll.passive="onViewportScroll"
    >
      <section
        v-for="(slide, idx) in slides"
        :id="`${panelId}-${slide.id}`"
        :key="slide.id"
        class="slide-panel relative min-h-full w-full snap-start"
        :aria-hidden="idx !== activeIndex"
      >
        <div
          class="relative min-h-full px-1 pt-1 pb-6 md:px-2"
          :tabindex="idx === activeIndex ? 0 : -1"
        >
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

    <div class="sr-only" aria-live="polite">
      <template v-if="activeSlideLabel">
        {{ activeIndex + 1 }} / {{ slides.length }} — {{ activeSlideLabel }}
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
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
const viewport = ref<HTMLElement | null>(null);
let scrollFrame: number | null = null;
let scrollGuardTimeout: ReturnType<typeof setTimeout> | null = null;
let isProgrammaticScroll = false;
let isSyncingFromViewport = false;

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
  if (scrollFrame !== null) {
    cancelAnimationFrame(scrollFrame);
  }
  if (scrollGuardTimeout) {
    clearTimeout(scrollGuardTimeout);
  }
});

function clamp(idx: number): number {
  if (props.slides.length === 0) return 0;
  if (idx < 0) return 0;
  if (idx >= props.slides.length) return props.slides.length - 1;
  return idx;
}

function clearScrollGuardAfterScroll(): void {
  if (scrollGuardTimeout) clearTimeout(scrollGuardTimeout);
  scrollGuardTimeout = setTimeout(() => {
    isProgrammaticScroll = false;
  }, 350);
}

function panelTop(idx: number): number {
  const host = viewport.value;
  const panel = host?.children.item(clamp(idx));
  return panel instanceof HTMLElement ? panel.offsetTop : 0;
}

function scrollToIndex(idx: number, behavior: ScrollBehavior = "smooth"): void {
  void nextTick(() => {
    const host = viewport.value;
    if (!host) return;

    const targetTop = panelTop(idx);
    if (Math.abs(host.scrollTop - targetTop) < 1) return;

    isProgrammaticScroll = true;
    host.scrollTo({ top: targetTop, behavior });
    clearScrollGuardAfterScroll();
  });
}

function syncIndexFromViewport(): void {
  scrollFrame = null;

  const host = viewport.value;
  if (!host || isProgrammaticScroll || host.clientHeight <= 0) return;

  const position = host.scrollTop + host.clientHeight * 0.25;
  const panels = Array.from(host.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
  const next = clamp(
    panels.reduce((active, panel, idx) => {
      return panel.offsetTop <= position ? idx : active;
    }, 0),
  );
  if (next === props.activeIndex) return;

  isSyncingFromViewport = true;
  emit("update:activeIndex", next);
  void nextTick(() => {
    isSyncingFromViewport = false;
  });
}

function onViewportScroll(): void {
  if (scrollFrame !== null) return;
  scrollFrame = requestAnimationFrame(syncIndexFromViewport);
}

watch(
  () => props.activeIndex,
  (idx) => {
    if (isSyncingFromViewport) return;
    scrollToIndex(idx);
  },
  { immediate: true, flush: "post" },
);
</script>
