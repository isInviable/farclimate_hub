<template>
  <div
    ref="pinWrapper"
    class="pin-wrapper relative group w-full"
    :class="{ 'pin-active': isPinnedUi }"
  >
    <slot></slot>
    <UButton
      icon="mdi:pin"
      variant="ghost"
      color="primary"
      class="cursor-pointer pin-button absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1 rounded-full shadow-md hover:bg-gray-50"
      :class="{ 'opacity-100': isPinnedUi }"
      :loading="pinBusy"
      :aria-label="$t('pins.capture.buttonAria')"
      @click.stop="handlePinButton"
    />

    <PinCaptureDialog
      v-model:open="isCaptureDialogOpen"
      :body-kind="captureDialogBodyKind"
      :title="pinTitle"
      :preview="capturePreview"
      :saving="pinBusy"
      :error="saveError"
      @save="savePin"
      @cancel="saveError = null"
    />
  </div>
</template>

<script setup lang="ts">
import { usePin } from "@/composables/usePin";
import { usePinsSupabase } from "~/composables/usePinsSupabase";
import PinCaptureDialog from "../../PinCaptureDialog.vue";

const props = defineProps<{
  contentSelector?: string;
  /** @deprecated Prefer `documentUid`; kept for callers that still pass search hit id. */
  pinId?: string;
  pinTitle?: string;
  pinType?: "result" | "contact" | "image" | "website" | "other";
  /** Search / article payload; `document_uid` is used for dedupe and unpin. */
  pinData?: unknown;
}>();

const emit = defineEmits<{
  (e: "pinned"): void;
  (e: "unpinned"): void;
}>();

const { pinCapture, pinContent, unpinContent } = usePin();
const pinsApi = usePinsSupabase();
const pinWrapper = ref<HTMLElement | null>(null);
const contentElement = ref<HTMLElement | null>(null);
const isCaptureDialogOpen = ref(false);
const pinBusy = ref(false);
const saveError = ref<string | null>(null);
/** Pins without `document_uid` (e.g. some blocks): track row id locally. */
const adHocRowId = ref<string | null>(null);

const documentUid = computed(() => {
  const d = props.pinData as { document_uid?: string } | null | undefined;
  return d?.document_uid;
});

/**
 * Snapshot the search-result's `[lat, lon]` so `body.data.location` gets
 * stamped on pin creation, feeding the pinboard map view (change
 * `pinboard-global-map`). Validation happens inside `pinContent`.
 */
const documentLocation = computed<[number, number] | null>(() => {
  const raw = (props.pinData as { location?: unknown } | null | undefined)
    ?.location;
  if (!Array.isArray(raw) || raw.length !== 2) return null;
  const [lat, lon] = raw as unknown[];
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  return [lat, lon];
});

const rowIdForDocument = computed(() =>
  documentUid.value
    ? pinsApi.findPinIdByDocumentUid(documentUid.value)
    : null
);

const effectiveRowId = computed(
  () => rowIdForDocument.value ?? adHocRowId.value
);

const isPinnedUi = computed(() => {
  if (documentUid.value)
    return pinsApi.isDocumentPinned(documentUid.value);
  return !!adHocRowId.value;
});

/** DOM capture path for `pinContent` (fragments); not used for whole-document search rows. */
const bodyKind = computed(() => {
  if (props.pinType === "website") return "website";
  if (props.pinType === "contact") return "contact";
  if (props.pinType === "image") return "image";
  return "text_segment";
});

/** Label shown in `PinCaptureDialog` — whole-document hits use `document`. */
const captureDialogBodyKind = computed(() => {
  if (props.pinType === "result" && documentUid.value) return "document";
  return bodyKind.value;
});

const isFullDocumentResultPin = computed(
  () => props.pinType === "result" && !!documentUid.value,
);

const pinTitle = computed(() => props.pinTitle?.trim() || undefined);

const capturePreview = computed(() => {
  const pinDataRecord =
    props.pinData &&
    typeof props.pinData === "object" &&
    !Array.isArray(props.pinData)
      ? (props.pinData as Record<string, unknown>)
      : null;

  for (const key of ["subtitle", "description", "title"]) {
    const value = pinDataRecord?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return (
    contentElement.value?.innerText ||
    contentElement.value?.textContent ||
    props.pinTitle ||
    ""
  ).trim();
});

onMounted(() => {
  if (pinWrapper.value) {
    contentElement.value = props.contentSelector
      ? (pinWrapper.value.querySelector(props.contentSelector) as HTMLElement)
      : (pinWrapper.value.firstElementChild as HTMLElement);
  }
});

async function handlePinButton() {
  if (!contentElement.value || pinBusy.value) return;

  if (!isPinnedUi.value) {
    saveError.value = null;
    isCaptureDialogOpen.value = true;
    return;
  }

  pinBusy.value = true;
  try {
    const id = effectiveRowId.value;
    if (id) await unpinContent(id);
    adHocRowId.value = null;
    emit("unpinned");
  } finally {
    pinBusy.value = false;
  }
}

async function savePin(note: string) {
  if (!contentElement.value || pinBusy.value) return;

  pinBusy.value = true;
  saveError.value = null;
  try {
    const pinDataRecord =
      props.pinData &&
      typeof props.pinData === "object" &&
      !Array.isArray(props.pinData)
        ? (props.pinData as Record<string, unknown>)
        : undefined;

    const id = isFullDocumentResultPin.value
      ? await pinCapture({
          bodyKind: "document",
          title: props.pinTitle,
          data: {},
          notes: note,
          sourceDocumentUid: documentUid.value ?? null,
          location: documentLocation.value,
          animationElement: contentElement.value,
        })
      : await pinContent(contentElement.value, {
          sourceDocumentUid: documentUid.value ?? null,
          title: props.pinTitle,
          type: props.pinType,
          data: pinDataRecord,
          notes: note,
          location: documentLocation.value,
        });
    if (!id) {
      saveError.value = pinsApi.error.value ?? "Could not save pin";
      return;
    }
    if (!documentUid.value) adHocRowId.value = id;
    isCaptureDialogOpen.value = false;
    emit("pinned");
  } finally {
    pinBusy.value = false;
  }
}
</script>

<style scoped>
.pin-wrapper {
  display: inline-block;
}

.pin-active {
  position: relative;
}
</style>
