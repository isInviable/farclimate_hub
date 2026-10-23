<script setup lang="ts">
defineProps<{
  segments: { text: string, keyword?: boolean }[]
}>()
</script>

<template>
  <p class="font-adapt-body text-base leading-snug text-adapt-ink">
    <template v-for="(segment, index) in segments" :key="index">
      <span
        v-if="segment.keyword"
        class="mt-2 block font-adapt-keyword text-xl tracking-wide text-adapt-ink uppercase"
      >{{ segment.text }}</span>
      <span v-else class="block">{{ segment.text }}</span>
    </template>
  </p>
</template>
