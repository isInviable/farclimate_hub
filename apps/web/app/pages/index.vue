<template>
  <div v-if="home">
    <!-- Hero -->
    <section
      class="relative min-h-[560px] h-[80vh] flex items-center text-white bg-cover bg-center"
      style="background-image: url('/img/hero.png')"
    >
      <div class="absolute inset-0 bg-black/40" aria-hidden="true" />
      <UContainer class="relative z-10 pt-16">
        <div class="text-center max-w-4xl mx-auto">
          <h1 class="typo-display">
            <span class="block">{{ home.hero.titleLine1 }}</span>
            <span class="block">{{ home.hero.titleLine2 }}</span>
          </h1>
          <p class="font-mono text-lg mt-6 opacity-90 max-w-3xl mx-auto">
            {{ home.hero.subtitle }}
          </p>
          <div class="mt-8 flex items-center justify-center">
            <UFieldGroup>
              <UButton
                color="neutral"
                variant="outline"
                size="xl"
                class="bg-white text-neutral-900 border-white"
                @click="scrollToContent"
              >
                {{ home.hero.cta }}
              </UButton>
              <UButton
                color="primary"
                size="xl"
                :aria-label="home.hero.scrollLabel"
                @click="scrollToContent"
              >
                <UIcon name="material-symbols:arrow-downward" />
              </UButton>
            </UFieldGroup>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- 01. Inspiration & Learning -->
    <section id="inspiration" class="py-20 md:py-24 bg-white">
      <UContainer>
        <HomeSectionHeading
          :number="home.sections.inspiration.number"
          :title="home.sections.inspiration.title"
          :intro="home.sections.inspiration.intro"
        />

        <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="md:col-span-1">
            <h3 class="typo-h4 text-neutral-900">
              {{ home.sections.inspiration.problemSpace.title }}
            </h3>
          </div>
          <div class="md:col-span-2">
            <p class="font-mono text-base font-light text-neutral-900">
              {{ home.sections.inspiration.problemSpace.description }}
            </p>
          </div>
        </div>

        <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="dim in home.sections.inspiration.dimensions"
            :key="dim.title"
            class="flex flex-col items-start gap-6"
          >
            <img :src="dim.icon" :alt="dim.title" class="size-24" />
            <div>
              <p class="font-mono font-bold text-lg text-neutral-900">{{ dim.title }}</p>
              <p class="font-mono text-sm font-light text-neutral-900 mt-2">
                {{ dim.description }}
              </p>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Economic sectors -->
    <section class="bg-neutral-100 py-20">
      <UContainer>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div class="md:col-span-1">
            <h3 class="typo-h4 text-neutral-900">
              {{ home.sections.inspiration.sectors.title }}
            </h3>
          </div>
          <div class="md:col-span-2">
            <p class="font-mono text-base text-neutral-900">
              {{ home.sections.inspiration.sectors.description }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <HomeCard
            v-for="card in home.sections.inspiration.sectors.cards"
            :key="card.sector"
            :title="card.title"
            :img-src="card.image"
            :description="card.description"
            :title-class="card.titleClass"
            :button-label="card.buttonLabel"
            :to="sectorExplorerLink(card.sector)"
          />
        </div>
      </UContainer>
    </section>

    <!-- 02. Why this matters -->
    <section class="bg-neutral-50 py-20">
      <UContainer>
        <HomeSectionHeading
          :number="home.sections.whyMatters.number"
          :title="home.sections.whyMatters.title"
          :intro="home.sections.whyMatters.intro"
        />
        <HomeWhyMattersGrid :items="home.sections.whyMatters.items" />
      </UContainer>
    </section>

    <!-- 03. How this platform works -->
    <section class="bg-white py-20">
      <UContainer>
        <HomeSectionHeading
          :number="home.sections.platform.number"
          :title="home.sections.platform.title"
        />
        <HomePlatformStep
          v-for="(step, index) in home.sections.platform.steps"
          :key="step.key"
          :title="step.title"
          :body="step.body"
          :cta="step.cta"
          :image="step.image"
          :image-alt="step.imageAlt"
          :reverse="index % 2 === 1"
          cta-to="#recipe"
        />
      </UContainer>
    </section>

    <!-- 04. The Recipe -->
    <HomeRecipeSection
      :number="home.sections.recipe.number"
      :title="home.sections.recipe.title"
      :intro="home.sections.recipe.intro"
      :image="home.sections.recipe.image"
      :image-alt="home.sections.recipe.imageAlt"
    />
  </div>
</template>

<script lang="ts" setup>
const localePath = useLocalePath()
const { home } = await useHomeContent()

function scrollToContent() {
  const el = document.getElementById('inspiration')
  el?.scrollIntoView({ behavior: 'smooth' })
}

function sectorExplorerLink(sector: string) {
  return localePath({
    path: '/explorer/explorer',
    query: { sector },
  })
}
</script>
