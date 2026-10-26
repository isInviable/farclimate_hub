<script lang="ts" setup>
import HowToStage from '~/components/how-to/HowToStage.vue'

definePageMeta({
  layout: 'site',
})

const { howTo } = await useHowToContent()

useSeoMeta({
  title: () => {
    const intro = howTo.value?.intro
    if (!intro) return 'How to use the solutions'
    return `${intro.titleLines.join(' ')} ${intro.accent}`
  },
  description: () => {
    const intro = howTo.value?.intro
    if (!intro) return ''
    return `${intro.before}${intro.emphasis}${intro.middle} ${intro.after}`
  },
})
</script>

<template>
  <HowToStage
    v-if="howTo"
    :intro="howTo.intro"
    :steps="howTo.steps"
    :cta="howTo.cta"
  />
</template>
