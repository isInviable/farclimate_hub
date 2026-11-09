<script setup lang="ts">
interface AboutAnswer {
  key: string
  heading: string
  body: string
}

interface AboutContent {
  hero: {
    kickerLines: string[]
    wordLines: string[]
    hub: string
    image: string
    imageAlt: string
  }
  answers: AboutAnswer[]
  audience: {
    heading: string
    body: string
    image: string
    imageAlt: string
  }
  metaphor: {
    solution: string
    recipe: string
    nameLines: string[]
    body: string
    image: string
    imageAlt: string
  }
}

defineProps<{
  about: AboutContent
}>()
</script>

<template>
  <div>
    <section class="bg-adapt-foam">
      <div class="grid items-center gap-8 px-6 py-12 lg:grid-cols-2 lg:gap-12 lg:px-14 lg:py-16 container mx-auto">
        <div class="flex flex-col items-end text-right">
          <h1 class="font-adapt-keyword text-4xl leading-none text-adapt-ink lg:text-5xl">
            <span
              v-for="line in about.hero.kickerLines"
              :key="line"
              class="block"
            >{{ line }}</span>
          </h1>
          <p class="mt-3 font-adapt-heavy text-5xl leading-[0.8] text-adapt-orange lg:text-6xl">
            <span
              v-for="line in about.hero.wordLines"
              :key="line"
              class="block"
            >{{ line }}</span>
          </p>
          <p class="mt-3 font-adapt-title text-5xl leading-none text-adapt-ink lg:text-6xl">
            {{ about.hero.hub }}
          </p>
        </div>
        <img
          :src="about.hero.image"
          :alt="about.hero.imageAlt"
          class="mx-auto w-full max-w-xl object-contain"
        >
      </div>
    </section>

    <section class="bg-adapt-paper">
      <div class="px-6 py-16 lg:px-14 lg:py-20 container mx-auto">
        <div class="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div
            v-for="answer in about.answers"
            :key="answer.key"
          >
            <h2 class="font-adapt-keyword text-2xl leading-none text-adapt-ink">
              {{ answer.heading }}
            </h2>
            <p class="mt-3 font-adapt-body text-base leading-snug text-adapt-ink-light">
              {{ answer.body }}
            </p>
          </div>
        </div>
        <div class="mt-16 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <h2 class="font-adapt-keyword text-2xl leading-none text-adapt-ink">
              {{ about.audience.heading }}
            </h2>
            <p class="mt-3 max-w-3xl font-adapt-body text-base leading-snug text-adapt-ink-light">
              {{ about.audience.body }}
            </p>
          </div>
          <img
            :src="about.audience.image"
            :alt="about.audience.imageAlt"
            class="mx-auto w-56 object-contain lg:w-full"
          >
        </div>
      </div>
    </section>

    <section class="bg-adapt-yellow">
      <div class="grid items-center gap-10 px-6 py-16 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:gap-16 lg:px-14 lg:py-20 container mx-auto">
        <img
          :src="about.metaphor.image"
          :alt="about.metaphor.imageAlt"
          class="mx-auto w-72 object-contain lg:w-full"
        >
        <div>
          <h2>
            <span class="block font-adapt-heavy text-4xl leading-none text-adapt-orange">
              {{ about.metaphor.solution }}
            </span>
            <span class="ml-6 block font-adapt-heavy text-4xl leading-none text-adapt-blue lg:ml-10">
              {{ about.metaphor.recipe }}
            </span>
            <span class="ml-12 mt-1 block font-adapt-title text-4xl leading-none text-adapt-ink lg:ml-16">
              <span
                v-for="line in about.metaphor.nameLines"
                :key="line"
                class="block"
              >{{ line }}</span>
            </span>
          </h2>
          <p class="mt-6 max-w-2xl font-adapt-body text-base leading-snug text-adapt-ink lg:ml-16">
            {{ about.metaphor.body }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
