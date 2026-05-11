<template>
  <section class="explorer-editorial-panel p-6 md:p-8 mt-10 md:mt-12">
    <p class="explorer-mono-eyebrow mb-4">
      {{ $t("explorer.index.searchHint") }}
    </p>
    <div class="flex flex-col sm:flex-row justify-center gap-2 sm:items-stretch sm:-space-x-px">
      <UInput
        icon="i-lucide-search"
        size="md"
        variant="outline"
        color="neutral"
        class="grow sm:min-w-0"
        :placeholder="$t('explorer.index.searchPlaceholder')"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        @keyup.enter="goToExplorerSearch"
      />
      <UButton
        size="md"
        variant="outline"
        color="neutral"
        class="sm:shrink-0 justify-center"
        :to="explorerSearchTo"
      >
        <template #leading>
          <UIcon name="material-symbols-light:search" class="size-6" />
        </template>
        {{ $t("common.search") }}
      </UButton>
    </div>
  </section>
</template>

<script setup lang="ts">
const localePath = useLocalePath();

const props = defineProps<{
  modelValue: string;
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();

const explorerSearchTo = computed(() => {
  const q = props.modelValue.trim();
  const path = localePath("/explorer/explorer");
  return q.length > 0
    ? { path, query: { query: q } }
    : { path };
});

async function goToExplorerSearch() {
  const q = props.modelValue.trim();
  if (!q) return;
  await navigateTo({
    path: localePath("/explorer/explorer"),
    query: { query: q },
  });
}
</script>
