<template>
  <section id="recipe" class="bg-neutral-100 py-20">
    <UContainer>
      <HomeSectionHeading :number="number" :title="title" :intro="intro" />
      <div class="mt-16 shadow-lg">
        <img
          :src="image"
          :alt="imageAlt"
          class="w-full max-w-5xl mx-auto object-contain bg-white"
          loading="lazy"
        />
      </div>
    </UContainer>
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  number: string
  title: string
  intro: string
  image: string
  imageAlt: string
}>()
</script>
