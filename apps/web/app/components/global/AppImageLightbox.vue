<template>
  <UModal
    v-model:open="open"
    fullscreen
    portal="body"
    :title="titleText"
  >
    <template #body>
      <div class="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-2">
        <img
          v-if="src"
          :src="src"
          :alt="alt || titleText"
          class="max-h-[80vh] w-full object-contain"
        />
        <div
          v-if="description || credits"
          class="w-full max-w-3xl px-2 text-center text-sm text-neutral-600"
        >
          <p v-if="description" class="whitespace-pre-line">
            {{ description }}
          </p>
          <p v-if="credits" class="mt-1 text-xs italic text-neutral-500">
            {{ credits }}
          </p>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end">
        <UButton color="neutral" variant="soft" @click="open = false">
          {{ closeLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const props = withDefaults(
  defineProps<{
    src: string;
    alt?: string;
    title?: string | null;
    description?: string | null;
    credits?: string | null;
  }>(),
  { alt: "", title: null, description: null, credits: null },
);

const { t } = useI18n();

/**
 * Prefer the explicit image `title` when available (coming from
 * `knowledge.document_images.title`), fall back to `alt`, then to the
 * generic i18n lightbox title.
 */
const titleText = computed(() => {
  if (props.title && props.title.trim()) return props.title;
  if (props.alt && props.alt.trim()) return props.alt;
  return t("article.lightboxTitle");
});
const closeLabel = computed(() => t("article.lightboxClose"));
</script>
