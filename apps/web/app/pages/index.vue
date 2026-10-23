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
  </div>
</template>
