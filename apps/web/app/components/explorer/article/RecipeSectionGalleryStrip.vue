<template>
  <div
    ref="stripRef"
    class="recipe-section-gallery-strip mt-10 h-[160px] w-full min-w-0 overflow-hidden "
    aria-hidden="true"
  >
    <img
      :src="src"
      alt=""
      class="h-full w-full object-cover rounded-md"
      :style="{ objectPosition: `center ${displayObjectPositionY}%` }"
    >
  </div>
</template>

<script setup lang="ts">
import {
  inject,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import { RecipeScrollRootKey } from "./recipeScrollContext";

const props = withDefaults(
  defineProps<{
    src: string;
    /** Resting vertical focus when scroll parallax is off (0 = top, 100 = bottom). */
    objectPositionY?: number;
    /** How far scroll can shift the crop above/below the resting focus. */
    scrollRange?: number;
  }>(),
  { objectPositionY: 50, scrollRange: 35 },
);

const stripRef = ref<HTMLElement | null>(null);
const recipeScrollRoot = inject(RecipeScrollRootKey, null);
const displayObjectPositionY = ref(props.objectPositionY);
const reduceMotion = ref(false);

let scrollRaf = 0;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function updateObjectPositionFromScroll(): void {
  if (reduceMotion.value) {
    displayObjectPositionY.value = props.objectPositionY;
    return;
  }

  const el = stripRef.value;
  const root = recipeScrollRoot?.value ?? null;
  if (!el || !root) {
    displayObjectPositionY.value = props.objectPositionY;
    return;
  }

  const elRect = el.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  if (rootRect.height <= 0) return;

  const centerY = (elRect.top + elRect.bottom) / 2;
  const progress = clamp(
    (centerY - rootRect.top) / rootRect.height,
    0,
    1,
  );

  const halfRange = props.scrollRange / 2;
  const y =
    props.objectPositionY - halfRange + progress * props.scrollRange;

  displayObjectPositionY.value = clamp(y, 8, 92);
}

function scheduleScrollUpdate(): void {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    updateObjectPositionFromScroll();
  });
}

function onScroll(): void {
  scheduleScrollUpdate();
}

let scrollRootEl: HTMLElement | null = null;

function bindScrollRoot(): void {
  unbindScrollRoot();
  scrollRootEl = recipeScrollRoot?.value ?? null;
  if (!scrollRootEl) return;
  scrollRootEl.addEventListener("scroll", onScroll, { passive: true });
  scheduleScrollUpdate();
}

function unbindScrollRoot(): void {
  if (!scrollRootEl) return;
  scrollRootEl.removeEventListener("scroll", onScroll);
  scrollRootEl = null;
}

onMounted(() => {
  reduceMotion.value = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  bindScrollRoot();
  if (!scrollRootEl) {
    displayObjectPositionY.value = props.objectPositionY;
  }
});

onUnmounted(() => {
  unbindScrollRoot();
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
});

watch(
  () => recipeScrollRoot?.value,
  () => bindScrollRoot(),
);

watch(
  () => props.objectPositionY,
  () => scheduleScrollUpdate(),
);
</script>
