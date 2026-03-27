<template>
  <USlideover :open="open" class="max-w-5xl" :overlay="false" title="Article summary view" :modal="false">
    <template #header>
      <DialogTitle class="sr-only">
        {{ document.title || "Article summary view" }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        Detailed article panel with summary, map, and metadata.
      </DialogDescription>

      <div class="flex gap-2 items-center">
        <UButton
          :to="`/articles/${props.document.id}`"
          target="_blank"
          variant="ghost"
          :title="$t('common.openFullPage')"
          icon="mdi:open-in-new"
        >
         
        </UButton>
        <h2 class="font-semibold">{{ document.title }}</h2>
        <UButton @click="handleClose" icon="mdi:close" variant="ghost" />
      </div>
    </template>
    <template #body>
      <ArticleViewAI :document="document" :show-sidebar="false" />
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { DialogDescription, DialogTitle } from "reka-ui";
import { useI18n } from "vue-i18n";
import type { ArticleDetail } from "@/types/search";
import ArticleViewAI from "./ArticleViewAI.vue";

const { t: $t } = useI18n();

const props = defineProps<{
  document: ArticleDetail;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

function disableScroll() {
  document.body.style.overflow = "hidden";
  document.body.style.paddingRight = "15px"; // Prevent layout shift
}

function enableScroll() {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}

function handleClose() {
  enableScroll();
  emit("close");
}

onMounted(() => {
  disableScroll();
});

onBeforeUnmount(() => {
  enableScroll();
});
</script>

<style scoped>
.side-panel-enter-active,
.side-panel-leave-active {
  transition: transform 0.3s ease;
}

.side-panel-enter-from,
.side-panel-leave-to {
  transform: translateX(-100%);
}
</style>
