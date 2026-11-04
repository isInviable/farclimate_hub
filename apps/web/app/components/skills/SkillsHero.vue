<script setup lang="ts">
const { tm, rt } = useI18n()

const topics = computed(() => {
  const raw = tm('skills.index.topics')
  if (!Array.isArray(raw)) return []
  return raw.map((item) => (typeof item === 'string' ? item : String(rt(item))))
})
</script>

<template>
  <section class="bg-adapt-skills-paper lg:grid lg:grid-cols-3">
    <div class="flex flex-col bg-adapt-yellow lg:col-span-2">
      <img
        src="/img/adaptarium/skills/habilidades.png"
        alt=""
        class="w-full object-contain"
      />
      <div class="px-8 pb-12 lg:px-16 lg:pb-16">
        <p class="font-adapt-heavy text-5xl leading-none text-adapt-skills-pine">
          {{ $t('skills.index.kicker') }}
        </p>
        <h1 class="mt-2 font-adapt-title text-4xl leading-none text-black lg:ml-8">
          {{ $t('skills.index.title') }}
        </h1>
        <p class="mt-4 max-w-xl font-adapt-body text-base leading-relaxed text-black lg:pl-12">
          {{ $t('skills.index.lede') }}
        </p>
      </div>
    </div>

    <div class="bg-adapt-skills-lagoon px-8 py-12 text-white lg:px-10 lg:py-16">
      <p class="font-adapt-keyword text-2xl uppercase leading-tight tracking-wide">
        {{ $t('skills.index.topicsHeading') }}
      </p>
      <ul class="mt-6 space-y-1 pl-8 font-adapt-keyword text-2xl uppercase leading-tight tracking-wide">
        <li
          v-for="topic in topics"
          :key="topic"
        >
          {{ topic }}
        </li>
      </ul>
    </div>
  </section>
</template>
