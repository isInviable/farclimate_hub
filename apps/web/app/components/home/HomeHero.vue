<script setup lang="ts">
defineProps<{
  hero: {
    wordmark: string[]
    tagline: string
    taglineSecondary: string
    image: string
    imageAlt: string
    intro: { text: string, keyword?: boolean }[]
    cta: { label: string, to: string, image: string }
  }
}>()
</script>

<template>
  <section class="overflow-hidden bg-adapt-paper lg:grid lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_22rem]">
    <div class="mx-auto grid w-full items-center gap-10 px-6 py-12 lg:h-dvh lg:grid-cols-[1fr_22rem_1fr] lg:gap-10 lg:px-14 lg:py-0">
      <div class="flex flex-col items-end lg:pr-4">
        <span
          v-for="line in hero.wordmark"
          :key="line"
          class="block font-adapt-heavy text-6xl leading-[0.82] tracking-tight text-adapt-orange xl:text-8xl"
        >{{ line }}</span>
        <span class="mt-4 font-adapt-keyword text-lg tracking-[0.18em] text-adapt-ink">{{ hero.tagline }}</span>
        <span class="font-adapt-title text-5xl leading-none text-adapt-ink xl:text-6xl">{{ hero.taglineSecondary }}</span>
      </div>
      <div class="relative mx-auto h-96 w-56 lg:h-full lg:w-full">
        <img
          :src="hero.image"
          :alt="hero.imageAlt"
          class="mx-auto h-full w-auto object-contain object-top lg:absolute lg:top-[-1.5rem] lg:left-1/2 lg:h-[calc(100%+1.5rem)] lg:w-auto lg:max-w-full lg:-translate-x-1/2"
        />
      </div>
      <div class="flex max-w-xs flex-col gap-8">
        <KeywordText :segments="hero.intro" />
        <StoneCta :label="hero.cta.label" :to="hero.cta.to" :image="hero.cta.image" />
      </div>
    </div>
    <SiteNavVertical class="hidden lg:flex" />
  </section>
</template>
