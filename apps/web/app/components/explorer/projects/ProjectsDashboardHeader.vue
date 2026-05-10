<template>
  <header class="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <EditorialEyebrow class="mb-2 block" color="muted">
        {{ eyebrow }}
      </EditorialEyebrow>
      <h1 class="font-display text-3xl font-bold tracking-tight text-neutral-darkest md:text-4xl">
        {{ title }}
      </h1>
      <p class="mt-2 max-w-2xl text-base leading-relaxed text-neutral-dark">
        {{ description }}
      </p>
    </div>
    <div class="shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    eyebrow?: string;
  }>(),
  {
    title: "Projects Dashboard",
    description:
      "Manage your climate adaptation research projects and their pinned items.",
    eyebrow: "Projects",
  }
);
</script>
