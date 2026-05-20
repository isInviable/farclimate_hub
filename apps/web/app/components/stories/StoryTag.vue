<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <span
    class="inline-flex rounded-full border border-neutral-darkest px-4 py-1.5 font-mono text-xs text-neutral-darkest"
  >
    {{ label }}
  </span>
</template>
