<script lang="ts" setup>
definePageMeta({
  layout: 'site',
})

const { howTo } = await useHowToContent()

useSeoMeta({
  title: () => howTo.value?.hero.title ?? 'How to use the solutions',
  description: () => howTo.value?.hero.intro ?? '',
})
</script>

<template>
  <div v-if="howTo">
    <header class="bg-adapt-blue px-6 py-16 text-white">
      <div class="mx-auto max-w-3xl">
        <h1 class="font-adapt-heavy text-4xl leading-tight tracking-tight uppercase md:text-6xl">
          {{ howTo.hero.title }}
        </h1>
        <p class="mt-6 max-w-2xl font-adapt-body text-lg leading-relaxed">
          {{ howTo.hero.intro }}
        </p>
      </div>
    </header>

    <ol class="mx-auto max-w-6xl">
      <li
        v-for="(step, index) in howTo.steps"
        :key="step.key"
        class="grid items-center gap-8 px-6 py-12 lg:grid-cols-2"
      >
        <div :class="index % 2 === 1 ? 'lg:order-2' : ''">
          <p class="font-adapt-heavy text-6xl leading-none text-adapt-orange">{{ index + 1 }}</p>
          <h2 class="mt-2 font-adapt-keyword text-3xl tracking-wide text-adapt-ink uppercase">
            {{ step.title }}
          </h2>
          <p class="mt-3 font-adapt-body text-base leading-relaxed text-adapt-ink">
            {{ step.body }}
          </p>
        </div>
        <img
          :src="step.image"
          :alt="step.imageAlt"
          class="w-full border border-adapt-ink"
          :class="index % 2 === 1 ? 'lg:order-1' : ''"
        />
      </li>
    </ol>

    <div class="flex justify-center bg-adapt-paper px-6 py-16">
      <StoneCta :label="howTo.cta.label" :to="howTo.cta.to" :image="howTo.cta.image" />
    </div>
  </div>
</template>
