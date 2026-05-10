<template>
  <span
    :class="[
      'font-mono uppercase tracking-[0.16em]',
      sizeClass,
      weightClass,
      colorClass,
    ]"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: '2xs' | 'xs' | 'sm'
    weight?: 'normal' | 'medium' | 'bold'
    color?: 'default' | 'muted' | 'primary' | 'paper'
  }>(),
  { size: '2xs', weight: 'bold', color: 'default' }
)

const sizeClass = computed(() => {
  if (props.size === 'xs') return 'text-xs'
  if (props.size === 'sm') return 'text-sm'
  return 'text-2xs'
})

const weightClass = computed(() => {
  if (props.weight === 'normal') return 'font-normal'
  if (props.weight === 'medium') return 'font-medium'
  return 'font-bold'
})

const colorClass = computed(() => {
  if (props.color === 'muted') return 'text-neutral-dark'
  if (props.color === 'primary') return 'text-primary-600'
  if (props.color === 'paper') return 'text-neutral-lightest'
  return 'text-neutral-darkest'
})
</script>
