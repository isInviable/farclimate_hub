<script setup lang="ts">
defineProps<{
  stories: {
    image: string
    imageAlt: string
    lines: { text: string, highlight?: boolean }[]
    cta: { label: string, to: string, image: string }
  }
}>()
</script>

<template>
  <section class="relative overflow-hidden">
    <img
      :src="stories.image"
      :alt="stories.imageAlt"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <div class="relative pt-[68px] pb-[219px] pl-[4.5rem] md:pl-[100px] lg:pl-[18.7vw]">
      <h2 class="flex flex-col gap-[11px] font-adapt-keyword text-[1.8125rem] leading-none tracking-[2px] uppercase lg:text-[3.1875rem]">
        <span
          v-for="line in stories.lines"
          :key="line.text"
          class="whitespace-pre-line"
          :class="line.highlight ? 'text-white' : 'text-white lg:text-adapt-aqua'"
        >{{ line.text }}</span>
      </h2>
      <NuxtLinkLocale
        :to="stories.cta.to"
        class="group relative mt-1 -ml-10 block w-[200px] md:ml-[-50px] md:w-[300px] lg:ml-16 lg:w-[340px]"
      >
        <img
          :src="stories.cta.image"
          alt=""
          class="w-full transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:rotate-[-3deg]"
        />
        <span class="absolute top-[71%] left-[44%] max-w-[50%] font-adapt-heavy text-[0.6875rem] leading-[1.1] tracking-[0.06em] text-white uppercase md:text-base lg:text-lg">
          {{ stories.cta.label }}
        </span>
      </NuxtLinkLocale>
    </div>
  </section>
</template>
