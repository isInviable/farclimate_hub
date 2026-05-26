<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { about } = await useAboutContent()

const heroImage = computed(() => about.value?.heroImage ?? '/img/hero.png')
const heroImageAlt = computed(
  () => about.value?.heroImageAlt ?? 'Climate adaptation landscape'
)

useSeoMeta({
  title: () => about.value?.title ?? 'About',
  description: () => about.value?.description ?? '',
})
</script>

<template>
  <div v-if="about" id="about" class="bg-white">
    <section
      class="relative min-h-[420px] flex items-end text-white bg-cover bg-center"
      :style="{ backgroundImage: `url('${heroImage}')` }"
    >
      <div class="absolute inset-0 bg-black/50" aria-hidden="true" />
      <UContainer class="relative z-10 py-20 md:py-28">
        <p class="font-mono text-sm uppercase tracking-widest text-white/80 mb-4">
          FARCLIMATE
        </p>
        <h1 class="typo-display max-w-4xl">
          {{ about.title }}
        </h1>
        <p class="font-mono text-lg mt-6 max-w-3xl text-white/90">
          {{ about.description }}
        </p>
      </UContainer>
    </section>

    <UContainer class="py-16 md:py-24">
      <ContentRenderer
        :value="about"
        class="about-prose prose prose-md md:prose-lg max-w-none text-neutral-900 prose-headings:font-display prose-headings:text-neutral-900 prose-p:font-mono prose-p:font-light prose-p:text-base prose-li:font-mono prose-li:font-light prose-strong:font-semibold prose-strong:text-neutral-900 prose-a:text-trust-blue-darkest prose-img:mx-auto prose-img:w-auto prose-img:max-w-md prose-img:max-h-56 prose-img:object-contain prose-img:rounded-none prose-figure:my-10 prose-figcaption:font-mono prose-figcaption:text-sm prose-figcaption:text-neutral-600 prose-figcaption:mt-3"
      />
    </UContainer>
  </div>
</template>
