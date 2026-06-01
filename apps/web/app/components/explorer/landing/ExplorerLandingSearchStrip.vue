<template>
  <section class="max-w-2xl mx-auto">
    <p class="font-mono text-sm text-neutral-darkest mb-4 text-center">
      {{ $t("explorer.index.searchHint") }}
    </p>
    <div class="flex flex-col sm:flex-row gap-2 sm:items-stretch">
      <UInput
        icon="i-lucide-search"
        size="xl"
        variant="outline"
        color="neutral"
        class="grow sm:min-w-0"
        :placeholder="$t('explorer.index.searchPlaceholder')"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        @keyup.enter="goToExplorerSearch"
      />
      <UButton
        size="xl"
        variant="solid"
        color="neutral"
        class="sm:shrink-0 justify-center bg-neutral-900 text-neutral-50 font-mono uppercase"
        :to="explorerSearchTo"
      >
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
  return q.length > 0
    ? localePath({ path: "/explorer/explorer", query: { query: q } })
    : localePath("/explorer/explorer");
});

async function goToExplorerSearch() {
  const q = props.modelValue.trim();
  if (!q) return;
  await navigateTo(localePath({ path: "/explorer/explorer", query: { query: q } }));
}
</script>
