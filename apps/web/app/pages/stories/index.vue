<script setup lang="ts">
definePageMeta({
  layout: 'stories',
})

const { storiesIndex } = await useStoriesIndexContent()
</script>

<template>
  <StoriesIndexPoster
    v-if="storiesIndex"
    :wordmark="storiesIndex.hero.wordmark"
    :subtitle="storiesIndex.hero.subtitle"
    :paragraphs="storiesIndex.hero.paragraphs"
    :image="storiesIndex.hero.image"
    :cards="storiesIndex.cards"
  />
</template>
