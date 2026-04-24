<template>
  <div
    ref="blockElement"
    class="relative group cursor-pointer transition-all duration-200 select-none"
    :class="{
      'ring-2 ring-slate-500 shadow-lg': isSelected,
      'hover:ring-2 hover:ring-slate-300 hover:shadow-md': !isSelected,
    }"
    @click="toggleSelected"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    tabindex="0"
    :aria-pressed="isSelected"
  >
    <div
      class=" p-4 bg-white rounded-md border border-gray-200 h-full w-full"
    >
      <div class="h-full w-full flex flex-col gap-2">
        <!-- TITLE -->
        <div class="flex items-center  gap-2">
          <Icon :name="icon" class="text-xl text-gray-500 shrink-0" />
          <div
            class="flex items-center gap-1 font-mono text-xs text-gray-500 mb-1 truncate"
          >
            {{ label }}
            <Icon
              v-if="showAiIcon"
              name="eos-icons:ai"
              class="w-6 h-6 ml-1 text-sky-500 align-middle"
            />
          </div>
        </div>
        <!-- CONTENT -->
        <div v-if="isHtml" v-html="value" class="text-sm" />
        <a
          v-else-if="isLink && value"
          :href="String(value)"
          target="_blank"
          class="text-blue-600 underline text-sm break-all"
          >{{ value }}</a
        >
        <div
          v-else-if="$slots.default"
          class="text-sm break-words h-full w-full"
        >
          <slot></slot>
        </div>
        <div v-else class="text-sm break-words">{{ value }}</div>
      </div>
      <button
        v-show="isHovered"
        @click.stop="handlePin"
        class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full shadow-md p-1 hover:bg-gray-50"
        :class="{ 'opacity-100': isPinned }"
      >
        <Icon name="mdi:pin" class="text-md text-black" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from "vue";
import { usePin } from "@/composables/usePin";
import { PinArticleContextKey } from "./pinContext";

type PinKind = "text_segment" | "contact" | "website" | "image";

interface Props {
  label?: string;
  value?: string | number;
  icon?: string;
  isHtml?: boolean;
  isLink?: boolean;
  showAiIcon?: boolean;
  /** Override the persisted `body_kind`; defaults to `text_segment`. */
  pinKind?: PinKind;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  value: "",
  icon: "",
  isHtml: false,
  isLink: false,
  showAiIcon: false,
  pinKind: "text_segment",
});

const { pinContent } = usePin();
const articleContext = inject(PinArticleContextKey, null);

const blockElement = ref<HTMLElement | null>(null);
const isSelected = ref(false);
const isHovered = ref(false);
const isPinned = ref(false);

function toggleSelected() {
  isSelected.value = !isSelected.value;
}

function resolvePinElement(): HTMLElement | null {
  if (!blockElement.value) return null;
  if (props.pinKind === "image") {
    const img = blockElement.value.querySelector("img");
    if (img instanceof HTMLImageElement) return img;
  }
  return blockElement.value;
}

async function handlePin() {
  if (isPinned.value || !blockElement.value) return;

  const el = resolvePinElement();
  if (!el) return;

  if (!articleContext) {
    const id = await pinContent(el, {
      bodyKind: props.pinKind,
      title: props.label || undefined,
    });
    if (id) isPinned.value = true;
    return;
  }

  const articleTitle = articleContext.title.value;
  const blockLabel = props.label?.trim() || "";
  const composedTitle = [articleTitle, blockLabel]
    .filter((s): s is string => !!s && s.trim().length > 0)
    .join(" — ");

  // Stamp the parent document's `[lat, lon]` into `body.data.location` so
  // the pinboard map view (change `pinboard-global-map`) can render a marker
  // for this article. Validation happens inside `pinContent`.
  const id = await pinContent(el, {
    sourceDocumentUid: articleContext.documentUid.value ?? null,
    title: composedTitle || undefined,
    bodyKind: props.pinKind,
    location: articleContext.location.value ?? null,
  });
  if (id) isPinned.value = true;
}
</script>

<style scoped>
.group:focus {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6;
}
</style>
