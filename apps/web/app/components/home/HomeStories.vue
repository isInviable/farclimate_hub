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
  <section class="relative overflow-hidden ">
    <img
      :src="stories.image"
      :alt="stories.imageAlt"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <div class="relative pt-17 pb-54.75 pl-18 md:pl-25 lg:pl-[18.7vw]">
      <h2 class="flex flex-col gap-2.75 font-adapt-keyword text-[1.8125rem] leading-none tracking-[2px] uppercase lg:text-[3.1875rem]">
        <span
          v-for="line in stories.lines"
          :key="line.text"
          class="whitespace-pre-line"
          :class="line.highlight ? 'text-white' : 'text-white lg:text-adapt-aqua'"
        >{{ line.text }}</span>
      </h2>
      <NuxtLinkLocale
        :to="stories.cta.to"
        class="group relative mt-1 -ml-10 w-50 md:-ml-12.5 md:w-75 lg:ml-16 lg:w-85 flex items-center justify-center "
      >
        <img
          :src="stories.cta.image"
          alt=""
          class=" transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:-rotate-3"
        />
        <span class="font-adapt-heavy text-[0.6875rem] leading-[1.1] tracking-[0.06em] group-hover:text-black uppercase md:text-base lg:text-lg text-white/80">
          {{ stories.cta.label }}
        </span>
      </NuxtLinkLocale>
    </div>
  </section>
</template>
