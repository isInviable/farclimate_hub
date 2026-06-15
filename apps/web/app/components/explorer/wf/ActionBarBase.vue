<template>
  <div
    class="fixed bottom-12 left-1/2 -translate-x-1/2 w-auto max-w-5xl z-50 transition-all duration-300"
  >
    <div
      class="flex items-stretch text-neutral-lightest"
      :class="
        variant === 'accent'
          ? 'bg-primary-600 border border-primary-600 drop-shadow-xl drop-shadow-black/70'
          : 'bg-neutral-darkest border border-neutral-darkest shadow-xl'
      "
    >
      <div
        class="flex items-center gap-3 px-4 py-2 border-r border-neutral-lightest/20"
      >
        <slot name="left" />
      </div>

      <div class="flex items-stretch divide-x divide-neutral-lightest/20">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** `accent` — primary blue surface (explorer); `default` — ink bar (board). */
    variant?: "default" | "accent";
  }>(),
  { variant: "default" },
);
</script>
