<template>
  <div
    ref="container"
    class="relative flex min-h-0 flex-1 flex-col"
    @mouseup="refreshSelection"
    @keyup="refreshSelection"
  >
    <slot />

    <div
      v-if="selectedText"
      class="absolute z-30 pointer-events-none"
      :style="floatingButtonStyle"
    >
      <UButton
        type="button"
        size="sm"
        color="primary"
        variant="solid"
        icon="i-lucide-pin"
        class="shadow-lg pointer-events-auto"
        @mousedown.prevent
        @click="openCapture"
      >
        {{ $t("pins.capture.selectedTextButton") }}
      </UButton>
    </div>

    <PinCaptureDialog
      v-model:open="dialogOpen"
      body-kind="selected_text"
      :title="captureTitle"
      :preview="selectedText"
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

const props = withDefaults(
  defineProps<{
    sourceView?: string;
  }>(),
  {
    sourceView: "article",
  },
);

const { pinCapture } = usePin();
const pinsApi = usePinsSupabase();
const articleContext = inject(PinArticleContextKey, null);

const container = ref<HTMLElement | null>(null);
const selectedText = ref("");
const selectionRect = ref<DOMRect | null>(null);
const dialogOpen = ref(false);
const isSaving = ref(false);
const saveError = ref<string | null>(null);

const captureTitle = computed(() => {
  const articleTitle = articleContext?.title.value?.trim() || "";
  return [articleTitle, "Selected text"].filter(Boolean).join(" — ");
});

const floatingButtonStyle = computed(() => {
  const host = container.value;
  const rect = selectionRect.value;
  if (!host || !rect) return {};

  const hostRect = host.getBoundingClientRect();
  const left = Math.max(8, rect.right - hostRect.left - 8);
  const top = Math.max(8, rect.bottom - hostRect.top + 8);

  return {
    left: `${left}px`,
    top: `${top}px`,
    transform: "translateX(-100%)",
  };
});

function selectionBelongsToContainer(selection: Selection): boolean {
  const host = container.value;
  if (!host || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  const ancestor = range.commonAncestorContainer;
  const node =
    ancestor.nodeType === Node.ELEMENT_NODE ? ancestor : ancestor.parentElement;
  return !!node && host.contains(node);
}

function refreshSelection() {
  if (typeof window === "undefined") return;
  const selection = window.getSelection?.();
  if (!selection || !selectionBelongsToContainer(selection)) {
    selectedText.value = "";
    selectionRect.value = null;
    return;
  }
  const range = selection.getRangeAt(0);
  const rects = Array.from(range.getClientRects()).filter(
    (rect) => rect.width > 0 && rect.height > 0,
  );
  selectedText.value = selection.toString().trim();
  selectionRect.value = selectedText.value
    ? rects.at(-1) ?? range.getBoundingClientRect()
    : null;
}

function openCapture() {
  refreshSelection();
  if (!selectedText.value) return;
  saveError.value = null;
  dialogOpen.value = true;
}

async function saveCapture(note: string) {
  if (!selectedText.value) return;
  isSaving.value = true;
  saveError.value = null;
  try {
    const id = await pinCapture({
      bodyKind: "selected_text",
      title: captureTitle.value || undefined,
      data: {
        quote: selectedText.value,
        markdown: selectedText.value,
        sourceView: props.sourceView,
      },
      notes: note,
      sourceDocumentUid: articleContext?.documentUid.value ?? null,
      location: articleContext?.location.value ?? null,
      animationElement: container.value,
    });
    if (!id) {
      saveError.value = pinsApi.error.value ?? "Could not save pin";
      return;
    }
    dialogOpen.value = false;
    selectedText.value = "";
    window.getSelection?.()?.removeAllRanges();
  } finally {
    isSaving.value = false;
  }
}
</script>
