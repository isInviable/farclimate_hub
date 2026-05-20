<script setup lang="ts">
defineProps<{
  shareLabel: string
  items: Array<{ icon: string; label: string }>
}>()
</script>

<template>
  <div class="border-y border-neutral py-6 px-6 md:px-20 bg-neutral-lightest">
    <div class="flex flex-wrap items-center gap-6">
      <span class="font-mono text-sm font-bold text-neutral-darkest uppercase tracking-wide">
        {{ shareLabel }}
      </span>
      <div class="flex flex-wrap gap-6">
        <span
          v-for="(item, i) in items"
          :key="i"
          class="inline-flex items-center gap-2 font-mono text-sm text-neutral-darkest"
        >
          <UIcon :name="item.icon" class="size-4" />
          {{ item.label }}
        </span>
      </div>
    </div>
  </div>
</template>
