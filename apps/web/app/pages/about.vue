<script lang="ts" setup>
import AboutStage from '~/components/about/AboutStage.vue'

definePageMeta({
  layout: 'site',
})

const { about } = await useAboutContent()

useSeoMeta({
  title: () => about.value?.title ?? 'About',
  description: () => about.value?.description ?? '',
})
</script>

<template>
  <AboutStage
    v-if="about"
    :about="about"
  />
</template>
