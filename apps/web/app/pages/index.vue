<script lang="ts" setup>
definePageMeta({
  layout: 'home',
})

const { home } = await useHomeContent()

useSeoMeta({
  title: 'ADAPTARIUM Transformation Hub',
})
</script>

<template>
  <div v-if="home">
    <HomeHero :hero="home.hero" />
    <HomeStats :stats="home.stats" />
    <HomeRecipe :recipe="home.recipe" />
    <HomeInspire :inspire="home.inspire" />
    <HomeStories :stories="home.stories" />
  </div>
</template>
