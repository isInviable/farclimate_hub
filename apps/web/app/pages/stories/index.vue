<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { storiesIndex } = await useStoriesIndexContent()
</script>

<template>
  <div v-if="storiesIndex" class="bg-neutral-white">
    <StoriesIndexHero
      :title="storiesIndex.hero.title"
      :subtitle="storiesIndex.hero.subtitle"
      :background-image="storiesIndex.hero.backgroundImage"
    />

    <section class="bg-neutral-lightest py-16 px-20">
      <UContainer class="px-0 max-w-none">
        <div class="flex flex-col gap-5">
          <StoryCard
            v-for="card in storiesIndex.cards"
            :key="card.slug"
            v-bind="card"
          />
        </div>
      </UContainer>
    </section>
  </div>
</template>
