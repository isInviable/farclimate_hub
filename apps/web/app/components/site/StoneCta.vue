<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  to: string
  image: string
  appearance?: 'orange' | 'light' | 'sand' | 'yellow'
  layout?: 'row' | 'stack'
  imageSide?: 'start' | 'end'
}>(), {
  appearance: 'orange',
  layout: 'row',
  imageSide: 'start',
})

const toneClass = {
  orange: 'text-adapt-orange',
  light: 'text-white',
  sand: 'text-adapt-sand',
  yellow: 'text-adapt-yellow',
} as const

const labelClass = computed(() => [
  'uppercase transition duration-300 ease-out group-hover:brightness-150 group-focus-visible:brightness-150',
  toneClass[props.appearance],
  props.appearance === 'yellow'
    ? 'font-adapt-keyword text-2xl leading-none tracking-wide whitespace-nowrap'
    : 'font-adapt-heavy',
  props.appearance !== 'yellow' && props.layout === 'stack'
    ? 'text-[1.375rem] leading-[1.1] tracking-[0.14em]'
    : '',
  props.appearance !== 'yellow' && props.layout !== 'stack'
    ? 'max-w-40 text-xl leading-tight tracking-tight'
    : '',
])

const linkClass = computed(() => {
  if (props.imageSide === 'end') return 'w-full items-end justify-end gap-3'
  if (props.layout === 'stack') return 'flex-col items-start gap-2'
  return 'items-center gap-4'
})
</script>

<template>
  <NuxtLinkLocale
    :to="to"
    class="group inline-flex"
    :class="linkClass"
  
  >
    <img
      :src="image"
      alt=""
      class="w-auto origin-bottom transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:rotate-[-8deg] group-focus-visible:-translate-y-1 group-focus-visible:rotate-[-8deg]"
      :class="[
        layout === 'stack' ? 'h-32' : 'h-24',
        imageSide === 'end' ? 'order-2' : 'order-1',
      ]"
    />
    <span
      :class="[labelClass, imageSide === 'end' ? 'order-1' : 'order-2']"
    class="group-hover:underline"
    >
      {{ label }}
    </span>
  </NuxtLinkLocale>
</template>
