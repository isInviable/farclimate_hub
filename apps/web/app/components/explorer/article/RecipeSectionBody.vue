<template>
  <CapturableBlock
    :title="section.title"
    pin-kind="recipe_section"
    source-view="structured"
    :payload="payload"
    :preview="section.content"
    :chrome="false"
  >
   
    <div
      class="prose prose-md md:prose-2xl max-w-none break-words text-neutral-800 prose-img:max-w-full prose-pre:overflow-x-auto"
      v-html="md.render(section.content)"
    />
  </CapturableBlock>
</template>

<script setup lang="ts">
import { computed } from "vue";
import MarkdownIt from "markdown-it";
import CapturableBlock from "../CapturableBlock.vue";
import type { RecipeSection } from "@/composables/useArticleRecipe";

const props = defineProps<{
  section: RecipeSection;
}>();

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const payload = computed(() => ({
  sectionKey: props.section.key,
  sectionTitle: props.section.title,
  markdown: props.section.content,
  sourceView: "structured",
}));
</script>
