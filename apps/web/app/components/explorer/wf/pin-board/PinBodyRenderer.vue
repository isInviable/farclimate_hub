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

const props = defineProps<{
  bodyKind: string
  data: Record<string, unknown>
}>();

const comp = computed(() => {
  const k = (props.bodyKind || "").toLowerCase();
  if (k === "chat") return PinRenderChat;
  if (k === "text_segment" || k === "document" || k === "section")
    return PinRenderText;
  if (k === "image") return PinRenderImage;
  return PinRenderFallback;
});
</script>
