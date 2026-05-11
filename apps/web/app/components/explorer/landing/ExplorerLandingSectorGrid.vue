<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <UButton
      :to="{ path: explorerPath, query: { sector: 'forestry' } }"
      size="lg"
      color="neutral"
      variant="outline"
      block
    >
      <template #leading>
        <UIcon name="material-symbols-light:forest" class="size-6" />
      </template>
      {{ $t("explorer.index.sectorForestry") }}
    </UButton>

    <UButton
      :to="{ path: explorerPath, query: { sector: 'fishery' } }"
      size="lg"
      color="neutral"
      variant="outline"
      block
    >
      <template #leading>
        <UIcon name="material-symbols-light:set-meal-outline-sharp" class="size-6" />
      </template>
      {{ $t("explorer.index.sectorFishery") }}
    </UButton>

    <UButton
      :to="{ path: explorerPath, query: { sector: 'agriculture' } }"
      size="lg"
      color="neutral"
      variant="outline"
      block
    >
      <template #leading>
        <UIcon name="material-symbols-light:nest-eco-leaf" class="size-6" />
      </template>
      {{ $t("explorer.index.sectorAgriculture") }}
    </UButton>
  </div>

  <div class="mt-6 flex justify-center">
    <UButton
      :to="{ path: explorerPath, query: { sector: 'all' } }"
      size="lg"
      color="neutral"
      variant="solid"
      class="grow md:max-w-md justify-center"
    >
      <template #leading>
        <UIcon name="material-symbols-light:globe" class="size-6" />
      </template>
      {{ $t("explorer.index.viewAll") }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath();
const explorerPath = computed(() => localePath("/explorer/explorer"));
</script>
