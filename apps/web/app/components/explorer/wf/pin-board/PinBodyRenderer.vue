<template>
  <component
    :is="comp"
    :data="data"
    :body-kind="bodyKind"
  />
</template>

<script setup lang="ts">
import PinRenderChat from "./PinRenderChat.vue";
import PinRenderText from "./PinRenderText.vue";
import PinRenderImage from "./PinRenderImage.vue";
import PinRenderFallback from "./PinRenderFallback.vue";
import PinRenderMarkmap from "./PinRenderMarkmap.client.vue";
import PinRenderDocument from "./PinRenderDocument.vue";

const props = defineProps<{
  bodyKind: string
  data: Record<string, unknown>
}>();

const comp = computed(() => {
  const k = (props.bodyKind || "").toLowerCase();
  if (k === "chat") return PinRenderChat;
  if (k === "markmap") return PinRenderMarkmap;
  if (k === "document") return PinRenderDocument;
  if (
    k === "text_segment" ||
    k === "selected_text" ||
    k === "recipe_section" ||
    k === "ai_summary" ||
    k === "grid_compare_summary" ||
    k === "chat_response" ||
    k === "reference" ||
    k === "section"
  )
    return PinRenderText;
  if (k === "image") return PinRenderImage;
  return PinRenderFallback;
});
</script>
