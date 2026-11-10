<template>
  <ClientOnly v-if="isMarkmap">
    <PinRenderMarkmap :data="data" :body-kind="bodyKind" />
    <template #fallback>
      <div class="h-52 min-h-52 w-full rounded-md border border-neutral-200 bg-white" />
    </template>
  </ClientOnly>
  <component
    :is="comp"
    v-else
    :data="data"
    :body-kind="bodyKind"
  />
</template>

<script setup lang="ts">
import PinRenderChat from "./PinRenderChat.vue";
import PinRenderText from "./PinRenderText.vue";
import PinRenderImage from "./PinRenderImage.vue";
import PinRenderFallback from "./PinRenderFallback.vue";
import PinRenderDocument from "./PinRenderDocument.vue";

// markmap touches `document` on import; a static import would pull it into the SSR bundle.
const PinRenderMarkmap = defineAsyncComponent(() => import("./PinRenderMarkmap.client.vue"));

const props = defineProps<{
  bodyKind: string
  data: Record<string, unknown>
}>();

const isMarkmap = computed(() => (props.bodyKind || "").toLowerCase() === "markmap");

const comp = computed(() => {
  const k = (props.bodyKind || "").toLowerCase();
  if (k === "chat") return PinRenderChat;
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
