<script setup lang="ts">
type StoryArticleAudio = {
  title: string
  src: string
}

type StoryArticleChapter = {
  kicker?: string
  label: string
  question: string
  paragraphs: string[]
  audio?: StoryArticleAudio
  closing?: string[]
}

defineProps<{
  hero: {
    wordmark: string[]
    subtitle: string
    name: string
    line: string
    portrait: string
    scene: string
  }
  identity: {
    theme: string
    name: string
    role: string
    place: string
  }
  lead: {
    question: string
    paragraphs: string[]
    quote: string
    afterQuote: string[]
    question2: string
    paragraphs2: string[]
  }
  banner: {
    image: string
    quote: string
  }
  chapters: StoryArticleChapter[]
}>()
</script>

<template>
  <article class="bg-adapt-paper">
    <section class="grid lg:grid-cols-5">
      <div class="relative flex min-h-105 flex-col justify-top overflow-hidden px-8 py-8 lg:col-span-2 bg-adapt-ink">
        <img
          src="/img/adaptarium/boton-saber-mas-7.png"
          class="absolute -bottom-20 right-32"
        />
        <div class="relative">
          <p class="font-adapt-heavy text-5xl leading-[0.9] text-adapt-yellow">
            <span
              v-for="line in hero.wordmark"
              :key="line"
              class="block"
            >{{ line }}</span>
          </p>
          <p class="mt-3 font-adapt-title text-4xl leading-none text-white ml-8 w-44">
            {{ hero.subtitle }}
          </p>
        </div>
      </div>
      <div class="relative flex min-h-105 flex-col justify-end overflow-hidden px-8 py-16 lg:col-span-3">
        <img
          :src="hero.scene"
          alt=""
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div class="relative">
          <h1 class="font-adapt-heavy text-5xl text-adapt-orange">
            {{ hero.name }}
          </h1>
          <p class="mt-2 whitespace-pre-line font-adapt-keyword text-3xl uppercase leading-tight tracking-wide text-adapt-paper">
            {{ hero.line }}
          </p>
        </div>
      </div>
    </section>

    <section class="grid bg-adapt-foam lg:grid-cols-5">
      <div class="flex flex-col gap-2 px-8 py-14 lg:col-span-2 lg:px-12">
        <h2 class="font-adapt-heavy text-4xl leading-tight text-adapt-paper ml-4">
          {{ identity.theme }}
        </h2>
        <p class="font-adapt-keyword text-3xl uppercase tracking-wide text-adapt-ink">
          {{ identity.name }}
        </p>
        <p class="font-adapt-keyword text-3xl uppercase leading-tight tracking-wide text-adapt-sea ml-6">
          {{ identity.role }}
        </p>
        <p class="whitespace-pre-line font-adapt-title text-5xl leading-none text-white ml-6">
          {{ identity.place }}
        </p>
      </div>
      <div class="flex flex-col gap-6 px-8 py-14 font-adapt-body text-base leading-relaxed text-adapt-ink lg:col-span-3 lg:px-12">
        <h3 class="font-adapt-keyword text-2xl uppercase leading-tight tracking-wide">
          {{ lead.question }}
        </h3>
        <p
          v-for="paragraph in lead.paragraphs"
          :key="paragraph"
        >{{ paragraph }}</p>
        <blockquote class="whitespace-pre-line text-center font-adapt-keyword text-2xl uppercase leading-tight tracking-wide text-adapt-sea">
          {{ lead.quote }}
        </blockquote>
        <p
          v-for="paragraph in lead.afterQuote"
          :key="paragraph"
        >{{ paragraph }}</p>
        <h3 class="font-adapt-keyword text-2xl uppercase leading-tight tracking-wide">
          {{ lead.question2 }}
        </h3>
        <p
          v-for="paragraph in lead.paragraphs2"
          :key="paragraph"
        >{{ paragraph }}</p>
      </div>
    </section>

    <section class="relative flex min-h-[320px] items-center justify-center overflow-hidden px-8 py-20">
      <img
        :src="banner.image"
        alt=""
        class="absolute inset-0 h-full w-full object-cover"
      />
      <p class="relative max-w-3xl text-center font-adapt-title text-3xl leading-tight text-white md:text-4xl">
        {{ banner.quote }}
      </p>
    </section>

    <section
      v-for="chapter in chapters"
      :key="chapter.label"
      class="grid bg-adapt-foam lg:grid-cols-5"
    >
      <div class="flex flex-col justify-center gap-2 px-8 py-14 lg:col-span-2 lg:px-12">
        <p
          v-if="chapter.kicker"
          class="font-adapt-title text-xl tracking-wide text-adapt-ink"
        >
          {{ chapter.kicker }}
        </p>
        <h2 class="font-adapt-title text-4xl leading-none text-adapt-ink">
          {{ chapter.label }}
        </h2>
      </div>
      <div class="flex flex-col gap-6 px-8 py-14 font-adapt-body text-base leading-relaxed text-adapt-ink lg:col-span-3 lg:px-12">
        <h3 class="font-adapt-keyword text-2xl uppercase leading-tight tracking-wide">
          {{ chapter.question }}
        </h3>
        <p
          v-for="paragraph in chapter.paragraphs"
          :key="paragraph"
        >{{ paragraph }}</p>
        <div
          v-if="chapter.audio"
          class="flex flex-col gap-3"
        >
          <h3 class="font-adapt-keyword text-2xl uppercase leading-tight tracking-wide">
            {{ chapter.audio.title }}
          </h3>
          <audio
            controls
            :src="chapter.audio.src"
            :aria-label="chapter.audio.title"
            class="w-full"
          />
        </div>
        <p
          v-for="paragraph in chapter.closing ?? []"
          :key="paragraph"
        >{{ paragraph }}</p>
      </div>
    </section>
  </article>
</template>
