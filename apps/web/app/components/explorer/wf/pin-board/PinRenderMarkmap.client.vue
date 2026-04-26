<script setup lang="ts">
import MarkmapViewer from "~/components/explorer/MarkmapViewer.client.vue";
import { DEFAULT_MARKMAP_YAML } from "~/constants/markmapDefaults";

const props = defineProps<{
  data: Record<string, unknown>
  bodyKind: string
}>();

const markdown = computed(() => {
  const m = props.data.markdown;
  return typeof m === "string" ? m : "";
});

const yaml = computed(() => {
  const y = props.data.yaml;
  return typeof y === "string" && y.trim() ? y : DEFAULT_MARKMAP_YAML;
});
</script>

<template>
  <div class="h-52 min-h-52 w-full overflow-hidden rounded-md border border-neutral-200 bg-white">
    <MarkmapViewer
      v-if="markdown"
      class="block h-full w-full"
      :markdown="markdown"
      :yaml="yaml"
      :show-toolbar="false"
      :auto-fit="true"
    />
    <p v-else class="p-3 text-sm text-neutral-500">
      {{ $t("pins.fallbackKind", { kind: props.bodyKind }) }}
    </p>
  </div>
</template>
