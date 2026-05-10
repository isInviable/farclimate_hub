<template>
  <div class="prose prose-sm max-w-none text-neutral-darker [&_p]:my-1">
    <div v-if="html" v-html="html" />
    <p v-else-if="plain" class="whitespace-pre-wrap font-mono text-sm">
      {{ plain }}
    </p>
    <p v-else class="font-sans text-sm text-neutral-dark italic">{{ $t("pins.textEmpty") }}</p>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ breaks: true, linkify: true });

const props = defineProps<{
  data: Record<string, unknown>
}>();

const plain = computed(() => {
  const d = props.data;
  if (typeof d.markdown === "string") return d.markdown;
  if (typeof d.text === "string") return d.text;
  if (typeof d.content === "string") return d.content;
  return "";
});

const html = computed(() => {
  const t = plain.value;
  if (!t.trim()) return "";
  return md.render(t);
});
</script>
