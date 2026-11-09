<script setup lang="ts">
interface Props {
  wordmark?: string[]
  tagline?: string
  taglineSecondary?: string
  size?: 'lg' | 'sm'
  tone?: 'dark' | 'light'
}

const props = withDefaults(defineProps<Props>(), {
  wordmark: () => ['ADAP', 'TA', 'RI', 'UM'],
  tagline: 'TRANSFORMATION',
  taglineSecondary: 'HUB',
  size: 'lg',
  tone: 'dark'
})

const sizeClasses = {
  lg: {
    wordmark: 'text-6xl xl:text-8xl',
    tagline: 'mt-4 text-lg',
    taglineSecondary: 'text-5xl xl:text-6xl'
  },
  sm: {
    wordmark: 'text-3xl',
    tagline: 'mt-2 text-[0.6rem]',
    taglineSecondary: 'text-2xl'
  }
}

const toneClasses = {
  dark: 'text-adapt-ink',
  light: 'text-neutral-50'
}

const classes = computed(() => sizeClasses[props.size])
const toneClass = computed(() => toneClasses[props.tone])
</script>

<template>
  <div class="flex flex-col items-end">
    <span
      v-for="line in wordmark"
      :key="line"
      class="block font-adapt-heavy leading-[0.82] tracking-tight text-adapt-orange"
      :class="classes.wordmark"
    >{{ line }}</span>
    <span
      class="font-adapt-keyword tracking-[0.18em]"
      :class="[classes.tagline, toneClass]"
    >{{ tagline }}</span>
    <span
      class="font-adapt-title leading-none"
      :class="[classes.taglineSecondary, toneClass]"
    >{{ taglineSecondary }}</span>
  </div>
</template>
