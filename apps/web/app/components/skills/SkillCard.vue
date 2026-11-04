<script setup lang="ts">
import type { SkillItem } from '~/types/skills'

defineProps<{
  item: SkillItem
  stoneSrc: string
}>()
</script>

<template>
  <article class="flex flex-col bg-adapt-ink px-8 py-8 text-white">
    <h2 class="font-adapt-keyword text-2xl uppercase leading-tight tracking-wide text-adapt-skills-card">
      {{ item.title }}
    </h2>
    <p class="mt-3 font-adapt-body text-base leading-snug">
      {{ item.description }}
    </p>
    <StoneCta
      class="mt-auto pt-6"
      appearance="yellow"
      image-side="end"
      :label="$t('skills.index.learnMore')"
      :to="item.url"
      :image="stoneSrc"
    />
  </article>
</template>
