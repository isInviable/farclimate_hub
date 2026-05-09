<template>
  <img
    v-if="resolvedSrc"
    :src="resolvedSrc"
    :alt="''"
    aria-hidden="true"
    class="pointer-events-none absolute select-none z-0"
    :class="[positionClass, sizeClass]"
    @error="hasError = true"
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { ArticleDecorationCorner } from "./articleDecorationContext";

type Corner = ArticleDecorationCorner;

const props = withDefaults(
  defineProps<{
    src?: string | null;
    corner?: Corner;
    /** Tailwind size utilities (default ~ 320px, large enough for the Figma corner art). */
    sizeClass?: string;
  }>(),
  {
    src: null,
    corner: "bottom-right",
    sizeClass: "max-w-[400px] max-h-[400px] w-auto h-auto",
  },
);

const hasError = ref(false);

const resolvedSrc = computed<string | null>(() => {
  if (hasError.value) return null;
  const raw = props.src;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
});

const positionClass = computed<string>(() => {
  switch (props.corner) {
    case "top-left":
      return "top-0 left-0";
    case "top-right":
      return "top-0 right-0";
    case "bottom-left":
      return "bottom-0 left-0";
    case "middle-left":
      return "top-1/2 left-0 -translate-y-1/2";
    case "middle-right":
      return "top-1/2 right-0 -translate-y-1/2";
    case "bottom-right":
    default:
      return "bottom-0 right-0";
  }
});
</script>
