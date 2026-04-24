<template>
  <div
    class="relative group bg-white rounded-lg shadow-md overflow-hidden border border-neutral-100"
  >
    <div v-if="enableSelection" class="absolute top-3 right-3 z-30">
      <UDropdownMenu :items="cardMenuItems" :ui="{ content: 'w-48' }">
        <UButton
          variant="ghost"
          size="sm"
          color="neutral"
          icon="i-heroicons-ellipsis-vertical"
          class="bg-white/90 shadow-sm hover:bg-white"
          :aria-label="$t('pins.cardMenuAria')"
        />
      </UDropdownMenu>
    </div>

    <button
      v-if="enableSelection"
      type="button"
      class="absolute bottom-3 right-3 z-20 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      :class="{ 'opacity-100': selectionStore.isSelected(pin.id) }"
      @click="selectionStore.toggleSelection(selectionItem)"
    >
      <Icon
        :name="
          selectionStore.isSelected(pin.id)
            ? 'mdi:check-circle'
            : 'mdi:plus-circle-outline'
        "
        size="1.75rem"
        :class="{
          'text-blue-500': selectionStore.isSelected(pin.id),
          'text-gray-500': !selectionStore.isSelected(pin.id),
        }"
      />
    </button>
    <div
      v-if="enableSelection"
      class="absolute inset-0 rounded-lg border-2 pointer-events-none z-10"
      :class="
        selectionStore.isSelected(pin.id)
          ? 'border-blue-500'
          : 'border-transparent'
      "
    />

    <div
      class="absolute top-3 left-3 z-20"
      :class="{ 'pr-10': enableSelection }"
    >
      <span class="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
        {{ bodyKindLabel }}
      </span>
    </div>

    <UModal v-model:open="isDeleteConfirmOpen" :title="deleteModalTitle">
      <template #body>
        <div class="space-y-3">
          <UAlert
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            :title="$t('pins.removeConfirmHeading')"
            :description="$t('pins.removeConfirmDescription')"
          />
          <UAlert
            v-if="deleteActionError"
            color="error"
            variant="outline"
            :title="$t('pins.removeConfirmFailed')"
            :description="deleteActionError"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            type="button"
            variant="ghost"
            color="neutral"
            :disabled="deleteLoading"
            @click="isDeleteConfirmOpen = false"
          >
            {{ $t("pins.removeConfirmCancel") }}
          </UButton>
          <UButton
            type="button"
            color="error"
            variant="outline"
            :loading="deleteLoading"
            icon="i-heroicons-trash"
            @click="confirmRemovePin"
          >
            {{ $t("pins.removeConfirmDelete") }}
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isEditNoteOpen" :title="$t('pins.editNoteTitle')">
      <template #body>
        <div class="space-y-3">
          <UTextarea
            v-model="editNoteDraft"
            :placeholder="$t('pins.notesPlaceholder')"
            :rows="6"
            autoresize
            class="w-full"
          />
          <UAlert
            v-if="editNoteError"
            color="error"
            variant="soft"
            :title="$t('pins.editNoteSaveFailed')"
            :description="editNoteError"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            type="button"
            variant="ghost"
            color="neutral"
            :disabled="editSaveLoading"
            @click="isEditNoteOpen = false"
          >
            {{ $t("pins.editNoteCancel") }}
          </UButton>
          <UButton
            type="button"
            color="primary"
            :loading="editSaveLoading"
            @click="saveEditedNote"
          >
            {{ $t("pins.editNoteSave") }}
          </UButton>
        </div>
      </template>
    </UModal>

    <div class="p-6 pt-14 space-y-3">
     
      

      <p
        v-if="
          !pin.source_document_uid &&
          (pin.body_kind === 'text_segment' || pin.body_kind === 'document')
        "
        class="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1"
      >
        {{ $t("pins.sourceMissing") }}
      </p>

      <div
        :class="[
          'space-y-3 -mx-2 px-2 py-1 rounded',
          pin.source_document_uid
            ? 'cursor-pointer hover:bg-neutral-50 transition-colors'
            : '',
        ]"
        :role="pin.source_document_uid ? 'button' : undefined"
        :tabindex="pin.source_document_uid ? 0 : undefined"
        @click="handleBodyClick"
        @keydown.enter.prevent="handleBodyClick"
        @keydown.space.prevent="handleBodyClick"
      >
        <h3 class="font-bold text-lg text-gray-900 line-clamp-2">
          {{ pin.source_title_snapshot?.trim() || $t("pins.noTitle") }}
        </h3>

        <PinBodyRenderer
          :body-kind="pin.body_kind"
          :data="bodyData"
        />

        <div v-if="pin.user_note?.trim()" class="pt-2 border-t border-neutral-100">
          <p class="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            {{ $t("pins.userNote") }}
          </p>
          <p class="text-sm text-neutral-700 whitespace-pre-wrap">
            {{ pin.user_note }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { HumanPinRow } from "~/types/pins";
import { pinToSelectionItem } from "~/utils/pinSelection";
import PinBodyRenderer from "./PinBodyRenderer.vue";
import { usePinnedSelectionStore } from "@/stores/selection";

const props = defineProps<{
  pin: HumanPinRow
  enableSelection?: boolean
}>();

const emit = defineEmits<{
  (e: "open-article", uid: string): void;
}>();

const { t, te } = useI18n();
const localePath = useLocalePath();
const selectionStore = usePinnedSelectionStore();
const pinsApi = usePinsSupabase();

const enableSelection = computed(() => props.enableSelection ?? false);

const isDeleteConfirmOpen = ref(false);
const isEditNoteOpen = ref(false);
const editNoteDraft = ref("");
const editNoteError = ref<string | null>(null);
const deleteActionError = ref<string | null>(null);
const deleteLoading = ref(false);
const editSaveLoading = ref(false);

const bodyData = computed(() => {
  const d = props.pin.body?.data;
  if (d && typeof d === "object" && !Array.isArray(d))
    return d as Record<string, unknown>;
  return {};
});

const selectionItem = computed(() => pinToSelectionItem(props.pin));

const deleteModalTitle = computed(() => {
  const title =
    props.pin.source_title_snapshot?.trim() || t("pins.noTitle");
  return t("pins.removeConfirmTitle", { title });
});

const cardMenuItems = computed((): DropdownMenuItem[][] => [
  [
    {
      label: t("pins.menuEditNote"),
      icon: "i-heroicons-pencil-square",
      onSelect: () => {
        openEditNoteModal();
      },
    },
    {
      label: t("pins.menuRemove"),
      icon: "i-heroicons-trash",
      color: "error",
      onSelect: () => {
        deleteActionError.value = null;
        isDeleteConfirmOpen.value = true;
      },
    },
  ],
]);

watch(isEditNoteOpen, (open) => {
  if (open) {
    editNoteDraft.value = props.pin.user_note ?? "";
    editNoteError.value = null;
  }
});

watch(isDeleteConfirmOpen, (open) => {
  if (open) deleteActionError.value = null;
});



function openEditNoteModal() {
  editNoteDraft.value = props.pin.user_note ?? "";
  editNoteError.value = null;
  isEditNoteOpen.value = true;
}

async function confirmRemovePin() {
  deleteLoading.value = true;
  deleteActionError.value = null;
  try {
    const ok = await pinsApi.deletePin(props.pin.id);
    if (!ok) {
      deleteActionError.value =
        pinsApi.error.value ?? t("pins.removeConfirmFailed");
      return;
    }
    if (selectionStore.isSelected(props.pin.id))
      selectionStore.toggleSelection(selectionItem.value);
    isDeleteConfirmOpen.value = false;
  } finally {
    deleteLoading.value = false;
  }
}

async function saveEditedNote() {
  editSaveLoading.value = true;
  editNoteError.value = null;
  try {
    const note = editNoteDraft.value.trim();
    const ok = await pinsApi.updatePin(props.pin.id, {
      user_note: note.length ? note : null,
    });
    if (!ok) {
      editNoteError.value =
        pinsApi.error.value ?? t("pins.editNoteSaveFailedGeneric");
      return;
    }
    isEditNoteOpen.value = false;
  } finally {
    editSaveLoading.value = false;
  }
}

const bodyKindLabel = computed(() => {
  const k = props.pin.body_kind || "unknown";
  const key = `pins.kinds.${k}`;
  return te(key) ? t(key) : t("pins.kinds.unknown");
});

function handleBodyClick() {
  const uid = props.pin.source_document_uid;
  if (!uid) return;
  if (typeof window !== "undefined") {
    const selection = window.getSelection?.();
    if (selection && selection.toString().length > 0) return;
  }
  emit("open-article", uid);
}
</script>
