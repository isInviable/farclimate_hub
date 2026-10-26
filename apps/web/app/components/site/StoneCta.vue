<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  to: string
  image: string
  appearance?: 'orange' | 'light' | 'sand'
  layout?: 'row' | 'stack'
}>(), {
  appearance: 'orange',
  layout: 'row',
})

const toneClass = {
  orange: 'text-adapt-orange',
  light: 'text-white',
  sand: 'text-adapt-sand',
} as const

const labelClass = computed(() => [
  'font-adapt-heavy uppercase',
  toneClass[props.appearance],
  props.layout === 'stack'
    ? 'text-[1.375rem] leading-[1.1] tracking-[0.14em]'
    : 'max-w-40 text-xl leading-tight tracking-tight',
])
</script>

<template>
  <NuxtLinkLocale
    :to="to"
    class="group inline-flex"
    :class="layout === 'stack' ? 'flex-col items-start gap-2' : 'items-center gap-4'"
  >
    <img
      :src="image"
      alt=""
      class="w-auto transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:rotate-[-4deg]"
      :class="layout === 'stack' ? 'h-32' : 'h-24'"
    />
    <span :class="labelClass">
      {{ label }}
    </span>
  </NuxtLinkLocale>
</template>
