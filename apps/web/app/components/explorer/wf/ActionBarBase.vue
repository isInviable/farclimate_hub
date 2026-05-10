<template>
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 w-auto max-w-5xl z-50 transition-all duration-300"
  >
    <div
      class="flex items-stretch bg-neutral-darkest text-neutral-lightest border border-neutral-darkest shadow-[0_8px_32px_rgba(16,0,7,0.25)]"
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
// Editorial action bar shell: ink-on-paper rectangle with divided segments.
</script>
