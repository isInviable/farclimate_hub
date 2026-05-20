<script setup lang="ts">
defineProps<{
  images: Array<{ src: string; alt: string }>
}>()
</script>

<template>
  <div v-if="images.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <img
      v-if="images[0]"
      :src="images[0].src"
      :alt="images[0].alt"
      class="md:col-span-2 w-full aspect-video object-cover border border-neutral"
    />
    <img
      v-for="(img, i) in images.slice(1, 3)"
      :key="i"
      :src="img.src"
      :alt="img.alt"
      class="w-full aspect-square object-cover border border-neutral"
    />
  </div>
</template>
