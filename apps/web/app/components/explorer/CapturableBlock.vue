<template>
  <div
    ref="blockElement"
    class="relative group"
    :class="chrome ? 'transition-all duration-200 hover:ring-2 hover:ring-slate-300 hover:shadow-md' : ''"
  >
    <div
      :class="
        chrome
          ? 'p-4 bg-white rounded-md border border-gray-200 h-full w-full'
          : 'h-full w-full'
      "
    >
      <div :class="chrome ? 'h-full w-full flex flex-col gap-2' : 'h-full w-full'">
        <div v-if="chrome && (label || icon)" class="flex items-center gap-2 pr-8">
          <Icon v-if="icon" :name="icon" class="text-xl text-gray-500 shrink-0" />
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

        <div v-if="isHtml" v-html="value" class="text-sm" />
        <a
          v-else-if="isLink && value"
          :href="String(value)"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 underline text-sm break-all"
          @click.stop
        >
          {{ value }}
        </a>
        <div v-else-if="$slots.default" class="text-sm wrap-break-word h-full w-full">
          <slot />
        </div>
        <div v-else class="text-sm wrap-break-word">{{ value }}</div>
      </div>

      <div v-if="captureEnabled" class="absolute top-2 right-2 z-10">
        <slot
          name="pin"
          :open-capture="openCapture"
          :is-pinned="isPinned"
          :is-saving="isSaving"
        >
          <UButton
            type="button"
            size="sm"
            color="neutral"
            variant="solid"
            icon="i-lucide-pin"
            :loading="isSaving"
            :aria-label="$t('pins.capture.buttonAria')"
            class=" opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 cursor-pointer hover:bg-primary-600"
            :class="{ 'opacity-60 bg-transparent text-black ': isPinned }"
            @click.stop="openCapture"
          />
        </slot>
      </div>
    </div>

    <PinCaptureDialog
      v-model:open="dialogOpen"
      :body-kind="bodyKind"
      :title="composedTitle"
      :preview="resolvedPreview"
      :saving="isSaving"
      :error="saveError"
      @save="saveCapture"
      @cancel="saveError = null"
    />
  </div>
</template>

<script setup lang="ts">
import PinCaptureDialog from "./PinCaptureDialog.vue";
import { PinArticleContextKey } from "./pinContext";
import type { PinCaptureBodyKind } from "~/types/pinCapture";

type LegacyPinType = "result" | "contact" | "image" | "website" | "other";

const props = withDefaults(
  defineProps<{
    label?: string;
    title?: string;
    value?: string | number;
    icon?: string;
    isHtml?: boolean;
    isLink?: boolean;
    showAiIcon?: boolean;
    pinKind?: PinCaptureBodyKind;
    type?: LegacyPinType;
    payload?: Record<string, unknown>;
    preview?: string;
    sourceView?: string;
    captureEnabled?: boolean;
    chrome?: boolean;
  }>(),
  {
    label: "",
    title: "",
    value: "",
    icon: "",
    isHtml: false,
    isLink: false,
    showAiIcon: false,
    pinKind: "text_segment",
    type: undefined,
    payload: undefined,
    preview: "",
    sourceView: "",
    captureEnabled: true,
    chrome: true,
  },
);

const { pinCapture } = usePin();
const pinsApi = usePinsSupabase();
const { promptAuthForPersistence } = useAccess();
const { t } = useI18n();
const articleContext = inject(PinArticleContextKey, null);

const blockElement = ref<HTMLElement | null>(null);
const dialogOpen = ref(false);
const isSaving = ref(false);
const saveError = ref<string | null>(null);
const createdPinId = ref<string | null>(null);

const bodyKind = computed<PinCaptureBodyKind>(() => {
  if (props.pinKind) return props.pinKind;
  if (props.type === "website") return "website";
  if (props.type === "contact") return "contact";
  if (props.type === "image") return "image";
  return "text_segment";
});

const blockTitle = computed(() => props.title?.trim() || props.label?.trim() || "");

const composedTitle = computed(() => {
  const articleTitle = articleContext?.title.value?.trim() || "";
  return [articleTitle, blockTitle.value].filter(Boolean).join(" — ");
});

const fallbackText = computed(() => {
  if (typeof props.value === "string" && props.value.trim()) return props.value.trim();
  if (typeof props.value === "number") return String(props.value);
  const el = blockElement.value;
  return (el?.innerText || el?.textContent || "").trim().slice(0, 8000);
});

const resolvedPayload = computed(() => {
  const data = props.payload ? { ...props.payload } : {};
  if (!("sourceView" in data) && props.sourceView) data.sourceView = props.sourceView;
  if (bodyKind.value === "website" && typeof props.value === "string" && props.value) {
    data.url = data.url ?? props.value;
  }
  if (
    bodyKind.value !== "image" &&
    !("markdown" in data) &&
    !("text" in data) &&
    fallbackText.value
  ) {
    data.markdown = fallbackText.value;
  }
  return data;
});

const resolvedPreview = computed(() => {
  if (props.preview?.trim()) return props.preview.trim();
  const data = resolvedPayload.value;
  for (const key of ["quote", "markdown", "text", "content", "description", "url"]) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (bodyKind.value === "image") {
    const alt = data.alt;
    return typeof alt === "string" && alt.trim() ? alt.trim() : blockTitle.value;
  }
  return fallbackText.value;
});

const isPinned = computed(() => {
  if (createdPinId.value) return true;
  const title = composedTitle.value;
  return pinsApi.pins.value.some((pin) => {
    if (pin.body_kind !== bodyKind.value) return false;
    if (pin.source_document_uid !== (articleContext?.documentUid.value ?? null))
      return false;
    return title ? pin.source_title_snapshot === title : false;
  });
});

function openCapture() {
  if (!promptAuthForPersistence("pin")) return;
  saveError.value = null;
  dialogOpen.value = true;
}

async function saveCapture(note: string) {
  isSaving.value = true;
  saveError.value = null;
  try {
    const id = await pinCapture({
      bodyKind: bodyKind.value,
      title: composedTitle.value || blockTitle.value || undefined,
      data: resolvedPayload.value,
      notes: note,
      sourceDocumentUid: articleContext?.documentUid.value ?? null,
      location: articleContext?.location.value ?? null,
      animationElement: blockElement.value,
    });
    if (!id) {
      saveError.value = pinsApi.error.value ?? t("pins.capture.saveFailed");
      return;
    }
    createdPinId.value = id;
    dialogOpen.value = false;
  } finally {
    isSaving.value = false;
  }
}
</script>
