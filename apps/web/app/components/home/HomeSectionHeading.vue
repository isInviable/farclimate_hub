<template>
  <div class="flex flex-col items-center gap-6 text-center">
    <div class="flex items-baseline gap-4">
      <span class="font-mono text-5xl text-neutral-500 opacity-70 shrink-0">{{ number }}</span>
      <h2 class="typo-h1 text-neutral-900 text-left">{{ title }}</h2>
    </div>
    <p v-if="intro" class="font-mono text-lg text-neutral-900 max-w-3xl">
      {{ intro }}
    </p>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  number: string
  title: string
  intro?: string
}>()
</script>
