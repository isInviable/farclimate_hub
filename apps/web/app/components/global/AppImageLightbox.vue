<template>
  <UModal
    v-model:open="open"
    fullscreen
    portal="body"
    :title="titleText"
  >
    <template #body>
      <div class="flex min-h-[60vh] items-center justify-center p-2">
        <img
          v-if="src"
          :src="src"
          :alt="alt || titleText"
          class="max-h-[85vh] w-full object-contain"
        />
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
  }>(),
  { alt: "" },
);

const { t } = useI18n();

const titleText = computed(() =>
  props.alt?.trim() ? props.alt : t("article.lightboxTitle"),
);
const closeLabel = computed(() => t("article.lightboxClose"));
</script>
