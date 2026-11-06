<script setup lang="ts">
defineProps<{
  stats: {
    image: string
    imageAlt: string
    items: { prefix?: string, value: string, label: string, highlight?: boolean }[]
  }
}>()

const firstWord = (label: string) => label.split(' ')[0]
const restWords = (label: string) => label.split(' ').slice(1).join(' ')
</script>

<template>
  <section class="relative overflow-hidden bg-adapt-ink">
    <img
      :src="stats.image"
      :alt="stats.imageAlt"
      class="h-72 w-full origin-[50%_0%] -scale-x-[1] scale-y-[1] object-cover lg:aspect-64/25 lg:h-auto"
    />
    <div
      class="relative bg-adapt-blue px-8 py-10 text-right text-white lg:absolute lg:top-[16%] lg:bottom-[9.5%] lg:left-[5%] lg:flex lg:w-[27%] lg:flex-col lg:justify-center lg:px-[2.6vw] lg:py-[2vw]"
    >
      <div v-for="item in stats.items" :key="item.label" class="mb-4 last:mb-0 lg:mb-[1.4vw]">
        <div class="font-adapt-heavy text-3xl leading-[0.9] tracking-tight text-adapt-yellow uppercase lg:text-[2.5vw]">
          <div class="flex justify-end ">
            <span v-if="item.prefix" class="block ">{{ item.prefix }}</span>          
          </div>
          {{ item.value }}
        </div>
        <p
          class="mt-2 font-adapt-keyword text-lg leading-[1.1] tracking-[0.12em] text-adapt-navy uppercase lg:mt-[0.6vw] lg:text-[1.25vw]"
        >
          <span class="block" :class="{ 'text-white': item.highlight }">{{ firstWord(item.label) }}</span>
          <span class="ml-auto block max-w-[9em]">{{ restWords(item.label) }}</span>
        </p>
      </div>
    </div>
  </section>
</template>
