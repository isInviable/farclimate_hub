<script setup lang="ts">
defineProps<{
  stats: Array<{
    value: string
    label: string
    description: string
    accentClass?: string
  }>
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div v-for="(stat, i) in stats" :key="i" class="flex flex-col gap-2">
      <p
        class="font-display font-bold text-5xl"
        :class="stat.accentClass || 'text-neutral-darkest'"
      >
        {{ stat.value }}
      </p>
      <p class="font-mono text-sm font-bold text-neutral-darkest">{{ stat.label }}</p>
      <p class="font-mono text-sm font-light text-neutral-dark">{{ stat.description }}</p>
    </div>
  </div>
</template>
