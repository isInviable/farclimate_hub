<template>
  <UModal v-model:open="open" :title="$t('pins.capture.title')">
    <template #body>
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {{ bodyKindLabel }}
          </p>
          <h3 class="text-base font-semibold text-neutral-900">
            {{ title || $t("pins.noTitle") }}
          </h3>
          <div
            v-if="previewText"
            class="max-h-40 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700 whitespace-pre-wrap"
          >
            {{ previewText }}
          </div>
        </div>

        <UFormField :label="$t('pins.capture.noteLabel')">
          <UTextarea
            v-model="note"
            :placeholder="$t('pins.capture.notePlaceholder')"
            :rows="5"
            autoresize
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="$t('pins.capture.saveFailed')"
          :description="error"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          type="button"
          variant="ghost"
          color="neutral"
          :disabled="saving"
          @click="cancel"
        >
          {{ $t("pins.capture.cancel") }}
        </UButton>
        <UButton
          type="button"
          color="primary"
          icon="i-lucide-pin"
          :loading="saving"
          @click="save"
        >
          {{ $t("pins.capture.save") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  bodyKind: string;
  title?: string;
  preview?: string;
  saving?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  save: [note: string];
  cancel: [];
}>();

const { t, te } = useI18n();
const note = ref("");

const previewText = computed(() => props.preview?.trim() ?? "");

const bodyKindLabel = computed(() => {
  const key = `pins.kinds.${props.bodyKind}`;
  return te(key) ? t(key) : t("pins.kinds.unknown");
});

watch(open, (value) => {
  if (value) note.value = "";
});

function cancel() {
  emit("cancel");
  open.value = false;
}

function save() {
  emit("save", note.value);
}
</script>
