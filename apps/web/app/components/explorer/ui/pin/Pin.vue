<template>
  <div
    ref="pinWrapper"
    class="pin-wrapper relative group w-full"
    :class="{ 'pin-active': isPinnedUi }"
  >
    <slot></slot>
    <UPopover arrow v-model:open="isPopoverOpen">
      <UButton
        @click="handlePin"
        icon="mdi:pin"
        variant="ghost"
        color="primary"
        class="cursor-pointer pin-button absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1 rounded-full shadow-md hover:bg-gray-50"
        :class="{ 'opacity-100': isPinnedUi }"
        :loading="pinBusy"
      >
      </UButton>
      <template #content>
        <div class="flex flex-col gap-2 px-4 py-4">
          <UTextarea
            v-model="pinNotes"
            :placeholder="$t('pins.notesPlaceholder')"
            size="lg"
            max-rows="8"
            class="w-72 "
          />
          <UButton
            @click="isPopoverOpen = false"
            class="cursor-pointer"
            color="neutral"
            >{{ $t("pins.saveNotes") }}</UButton
          >
        </div>
      </template>
    </UPopover>
  </div>
</template>

<script setup lang="ts">
import { usePin } from "@/composables/usePin";
import { usePinsSupabase } from "~/composables/usePinsSupabase";

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

const { pinContent, unpinContent } = usePin();
const pinsApi = usePinsSupabase();
const pinWrapper = ref<HTMLElement | null>(null);
const contentElement = ref<HTMLElement | null>(null);
const pinNotes = ref("");
const isPopoverOpen = ref(false);
const pinBusy = ref(false);
/** Pins without `document_uid` (e.g. some blocks): track row id locally. */
const adHocRowId = ref<string | null>(null);

const documentUid = computed(() => {
  const d = props.pinData as { document_uid?: string } | null | undefined;
  return d?.document_uid;
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

watch(isPopoverOpen, (open, wasOpen) => {
  if (open) {
    const id = effectiveRowId.value;
    if (id) {
      const row = pinsApi.pins.value.find((p) => p.id === id);
      pinNotes.value = row?.user_note ?? "";
    }
  } else if (wasOpen && effectiveRowId.value) {
    void pinsApi.updatePin(effectiveRowId.value, {
      user_note: pinNotes.value || null,
    });
  }
});

onMounted(() => {
  if (pinWrapper.value) {
    contentElement.value = props.contentSelector
      ? (pinWrapper.value.querySelector(props.contentSelector) as HTMLElement)
      : (pinWrapper.value.firstElementChild as HTMLElement);
  }
});

async function handlePin() {
  if (!contentElement.value || pinBusy.value) return;

  pinBusy.value = true;
  try {
    if (!isPinnedUi.value) {
      const pinDataRecord =
        props.pinData &&
        typeof props.pinData === "object" &&
        !Array.isArray(props.pinData)
          ? (props.pinData as Record<string, unknown>)
          : undefined;
      const id = await pinContent(contentElement.value, {
        sourceDocumentUid: documentUid.value ?? null,
        title: props.pinTitle,
        type: props.pinType,
        data: pinDataRecord,
        notes: pinNotes.value || undefined,
      });
      if (id && !documentUid.value) adHocRowId.value = id;
      emit("pinned");
    } else {
      const id = effectiveRowId.value;
      if (id) await unpinContent(id);
      adHocRowId.value = null;
      pinNotes.value = "";
      emit("unpinned");
    }
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
