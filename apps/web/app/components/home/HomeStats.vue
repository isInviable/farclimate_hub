<script setup lang="ts">
defineProps<{
  stats: {
    image: string
    imageAlt: string
    items: { prefix?: string, value: string, label: string }[]
  }
}>()
</script>

<template>
  <section class="relative bg-adapt-ink">
    <img :src="stats.image" :alt="stats.imageAlt" class="h-72 w-full object-cover lg:h-128" />
    <div class="bg-adapt-blue px-8 py-10 text-white lg:absolute lg:top-1/2 lg:left-16 lg:w-80 lg:-translate-y-1/2">
      <div v-for="item in stats.items" :key="item.label" class="mb-6 last:mb-0">
        <p v-if="item.prefix" class="font-adapt-heavy text-4xl leading-none tracking-tight text-adapt-yellow uppercase">
          {{ item.prefix }}
        </p>
        <p class="font-adapt-heavy text-6xl leading-none tracking-tight text-adapt-yellow">{{ item.value }}</p>
        <p class="mt-1 font-adapt-keyword text-lg tracking-wide uppercase">{{ item.label }}</p>
      </div>
    </div>
  </section>
</template>
