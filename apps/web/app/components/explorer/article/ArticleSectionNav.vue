<template>
  <nav
    :aria-label="navAriaLabel"
    class="article-section-nav min-w-0 max-w-full"
  >
    <ul class="flex flex-col items-start gap-2">
      <li
        v-for="(slide, idx) in slides"
        :key="slide.id"
        class="w-full"
      >
        <button
          type="button"
          :aria-current="idx === activeIndex ? 'true' : undefined"
          class="w-full rounded-sm text-left font-mono text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :class="
            idx === activeIndex
              ? 'cursor-default font-semibold text-neutral-darkest'
              : 'cursor-pointer text-neutral-600 hover:text-neutral-darkest'
          "
          @click="goTo(idx)"
        >
          <span class="mr-2 font-semibold">{{ idx + 1 }}</span>
          <span>{{ slide.label }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
export interface ArticleNavItem {
  id: string;
  label: string;
}
</script>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  slides: readonly ArticleNavItem[];
  activeIndex: number;
}>();

const emit = defineEmits<{
  (e: "update:activeIndex", index: number): void;
}>();

const { t } = useI18n();

const navAriaLabel = computed(() => t("article.secondaryNav.ariaLabel"));

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
