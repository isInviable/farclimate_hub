<template>
  <div
    class="recipe-segment-heading sticky top-0 z-20 border-b border-default/15 bg-neutral-lightest/90 pb-3 backdrop-blur supports-backdrop-filter:bg-neutral-lightest/75 mb-16"
  >
    <h2 class="flex min-w-0 items-baseline gap-2 leading-tight">
      <span
        v-if="number"
        class="font-mono text-2xl font-semibold text-neutral-600 md:text-5xl"
      >{{ number }}</span>
      <span
        class="font-display min-w-0 truncate text-2xl font-bold text-primary-600 md:text-6xl"
      >{{ label }}</span>
    </h2>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  number?: string;
  label: string;
}>();
</script>
