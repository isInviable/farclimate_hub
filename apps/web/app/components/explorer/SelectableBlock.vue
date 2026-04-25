<template>
  <CapturableBlock
    :label="label"
    :value="value"
    :icon="icon"
    :is-html="isHtml"
    :is-link="isLink"
    :show-ai-icon="showAiIcon"
    :pin-kind="pinKind"
    :payload="payload"
    :preview="preview"
    :source-view="sourceView"
    :capture-enabled="captureEnabled"
  >
    <slot />
  </CapturableBlock>
</template>

<script setup lang="ts">
import CapturableBlock from "./CapturableBlock.vue";

type PinKind =
  | "text_segment"
  | "selected_text"
  | "recipe_section"
  | "ai_summary"
  | "chat_response"
  | "contact"
  | "reference"
  | "website"
  | "image";

interface Props {
  label?: string;
  value?: string | number;
  icon?: string;
  isHtml?: boolean;
  isLink?: boolean;
  showAiIcon?: boolean;
  /** Override the persisted `body_kind`; defaults to `text_segment`. */
  pinKind?: PinKind;
  payload?: Record<string, unknown>;
  preview?: string;
  sourceView?: string;
  captureEnabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  label: "",
  value: "",
  icon: "",
  isHtml: false,
  isLink: false,
  showAiIcon: false,
  pinKind: "text_segment",
  payload: undefined,
  preview: "",
  sourceView: "",
  captureEnabled: true,
});
</script>
