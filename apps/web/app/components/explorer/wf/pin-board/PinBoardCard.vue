<template>
  <article
    class="relative group flex flex-col min-h-[220px]"
  >
    <div v-if="enableSelection" class="absolute top-3 right-3 z-30">
      <UDropdownMenu :items="cardMenuItems" :ui="{ content: 'w-48' }">
        <UButton
          variant="ghost"
          size="sm"
          color="neutral"
          icon="i-heroicons-ellipsis-vertical"
          :aria-label="$t('pins.cardMenuAria')"
        />
      </UDropdownMenu>
    </div>

    <button
      v-if="enableSelection"
      type="button"
      class="absolute bottom-3 right-3 z-20 p-1 bg-neutral-lightest border border-neutral-darkest opacity-0 group-hover:opacity-100 transition-opacity"
      :class="{ 'opacity-100': selectionStore.isSelected(pin.id) }"
      @click="selectionStore.toggleSelection(selectionItem)"
    >
      <Icon
        :name="
          selectionStore.isSelected(pin.id)
            ? 'mdi:check-circle'
            : 'mdi:plus-circle-outline'
        "
        size="1.5rem"
        :class="{
          'text-primary-600': selectionStore.isSelected(pin.id),
          'text-neutral-dark': !selectionStore.isSelected(pin.id),
        }"
      />
    </button>
    <div
      v-if="enableSelection && selectionStore.isSelected(pin.id)"
      class="absolute inset-0 border-2 border-primary-600 pointer-events-none z-10"
    />

    <div
      class="absolute top-4 left-5 z-20"
      :class="{ 'pr-10': enableSelection }"
    >
      <EditorialEyebrow
        class="inline-flex items-center gap-1 px-2 py-1 border border-neutral-darkest bg-warm-neutral-200"
      >
        {{ bodyKindLabel }}
      </EditorialEyebrow>
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

    <UModal v-model:open="isMarkmapFullscreenOpen" fullscreen>
      <template #body>
        <div class="max-w-6xl mx-auto py-6 px-4">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 class="text-xl font-semibold text-gray-900">
              {{ $t("pins.kinds.markmap") }}
            </h2>
            <div class="flex flex-wrap items-center gap-2">
              <UButton
                v-if="pin.source_document_uid"
                size="sm"
                variant="soft"
                color="primary"
                icon="i-heroicons-document-text"
                @click="openLinkedArticleFromMarkmapModal"
              >
                {{ $t("pins.markmapOpenLinkedArticle") }}
              </UButton>
              <UButton
                size="sm"
                variant="outline"
                @click="isMarkmapFullscreenOpen = false"
              >
                {{ $t("pins.markmapClose") }}
              </UButton>
            </div>
          </div>
          <div
            class="bg-white rounded-md border border-gray-200 h-[70vh] min-h-[400px] p-0 overflow-hidden"
          >
            <ClientOnly>
              <MarkmapViewer
                v-if="markmapFullscreenMarkdown"
                :markdown="markmapFullscreenMarkdown"
                :yaml="markmapFullscreenYaml"
                :show-toolbar="true"
                @article-click="onMarkmapArticleClick"
              />
            </ClientOnly>
          </div>
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

    <div class="p-6 pt-14 space-y-3 flex-1 flex flex-col">
      <p
        v-if="
          !pin.source_document_uid &&
          (pin.body_kind === 'text_segment' || pin.body_kind === 'document')
        "
        class="editorial-warning-chip self-start"
      >
        {{ $t("pins.sourceMissing") }}
      </p>

      <div
        :class="[
          'space-y-3',
          pin.source_document_uid || markmapBodyClickable
            ? 'cursor-pointer hover:bg-warm-neutral-100 -mx-2 px-2 py-1 transition-colors'
            : '',
        ]"
        :role="pin.source_document_uid || markmapBodyClickable ? 'button' : undefined"
        :tabindex="pin.source_document_uid || markmapBodyClickable ? 0 : undefined"
        @click="handleBodyClick"
        @keydown.enter.prevent="handleBodyClick"
        @keydown.space.prevent="handleBodyClick"
      >
        <h3 class="font-display font-bold text-lg text-neutral-darkest line-clamp-2">
          {{ pin.source_title_snapshot?.trim() || $t("pins.noTitle") }}
        </h3>

        <PinBodyRenderer
          :body-kind="pin.body_kind"
          :data="bodyData"
        />

        <div v-if="pin.user_note?.trim()" class="pt-2 border-t border-neutral-darkest/15">
          <EditorialEyebrow color="muted" class="block">
            {{ $t("pins.userNote") }}
          </EditorialEyebrow>
          <p class="font-sans text-sm text-neutral-darker whitespace-pre-wrap mt-1">
            {{ pin.user_note }}
          </p>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { HumanPinRow } from "~/types/pins";
import { pinToSelectionItem } from "~/utils/pinSelection";
import PinBodyRenderer from "./PinBodyRenderer.vue";
import MarkmapViewer from "~/components/explorer/MarkmapViewer.client.vue";
import { DEFAULT_MARKMAP_YAML } from "~/constants/markmapDefaults";
import { usePinnedSelectionStore } from "@/stores/selection";

const props = defineProps<{
  pin: HumanPinRow
  enableSelection?: boolean
}>();

const emit = defineEmits<{
  (e: "open-article", uid: string): void;
}>();

const { t, te } = useI18n();
const selectionStore = usePinnedSelectionStore();
const pinsApi = usePinsSupabase();

const enableSelection = computed(() => props.enableSelection ?? false);

const isDeleteConfirmOpen = ref(false);
const isMarkmapFullscreenOpen = ref(false);
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

const markmapBodyClickable = computed(() => {
  if (props.pin.body_kind !== "markmap") return false;
  const m = bodyData.value.markdown;
  return typeof m === "string" && m.trim().length > 0;
});

const markmapFullscreenMarkdown = computed(() => {
  const m = bodyData.value.markdown;
  return typeof m === "string" ? m : "";
});

const markmapFullscreenYaml = computed(() => {
  const y = bodyData.value.yaml;
  return typeof y === "string" && y.trim() ? y : DEFAULT_MARKMAP_YAML;
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
  if (typeof window !== "undefined") {
    const selection = window.getSelection?.();
    if (selection && selection.toString().length > 0) return;
  }
  if (markmapBodyClickable.value) {
    isMarkmapFullscreenOpen.value = true;
    return;
  }
  const uid = props.pin.source_document_uid;
  if (!uid) return;
  emit("open-article", uid);
}

function onMarkmapArticleClick(articleId: string) {
  emit("open-article", articleId);
}

function openLinkedArticleFromMarkmapModal() {
  const uid = props.pin.source_document_uid;
  if (!uid) return;
  isMarkmapFullscreenOpen.value = false;
  emit("open-article", uid);
}
</script>
