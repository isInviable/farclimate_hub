<template>
  <nav
    :aria-label="navAriaLabel"
    class="article-section-nav min-w-0 max-w-full"
  >
    <div
      v-for="chapter in chapters"
      :key="chapter.id"
      class="mb-5 last:mb-0"
    >
      <p class="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-darkest">
        {{ chapter.label }}
      </p>
      <ul class="flex flex-col items-start gap-2">
        <li
          v-for="item in chapter.items"
          :key="item.id"
          class="w-full"
        >
          <button
            type="button"
            :aria-current="item.index === activeIndex ? 'true' : undefined"
            class="flex w-full items-start gap-2 rounded-sm text-left font-mono text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            :class="
              item.index === activeIndex
                ? 'cursor-default font-semibold text-neutral-darkest'
                : 'cursor-pointer text-neutral-600 hover:text-neutral-darkest'
            "
            @click="goTo(item.index)"
          >
            <img
              :src="item.image"
              alt=""
              class="mt-0.5 h-6 w-6 shrink-0 object-contain"
            >
            <span class="min-w-0 wrap-break-word">{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script lang="ts">
export interface ArticleNavItem {
  id: string;
  label: string;
  image: string;
  index: number;
}

export interface ArticleNavChapter {
  id: string;
  label: string;
  items: readonly ArticleNavItem[];
}
</script>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  chapters: readonly ArticleNavChapter[];
  activeIndex: number;
}>();

const emit = defineEmits<{
  (e: "update:activeIndex", index: number): void;
}>();

const { t } = useI18n();

const navAriaLabel = computed(() => t("article.secondaryNav.ariaLabel"));

function goTo(index: number): void {
  if (index === props.activeIndex) return;
  emit("update:activeIndex", index);
}
</script>
