<template>
  <div
    class="col-span-full flex flex-col items-center justify-center py-16 text-center"
  >
    <div
      class="mb-5 flex size-20 items-center justify-center rounded-full border border-neutral-darkest bg-neutral-lighter"
      aria-hidden="true"
    >
      <UIcon :name="icon" class="size-10 text-neutral-dark" />
    </div>
    <h3 class="font-display text-xl font-bold text-neutral-darkest">
      {{ heading }}
    </h3>
    <p class="mt-2 mb-8 max-w-md text-neutral-dark">
      {{ body }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    heading: string;
    body: string;
    icon?: string;
  }>(),
  {
    icon: "i-heroicons-folder-open",
  }
);
</script>
