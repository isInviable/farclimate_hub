<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    caption?: string
    /** Use `wide` for UI screenshots (e.g. recipe page). */
    size?: 'default' | 'wide'
  }>(),
  {
    size: 'default',
  }
)

const figureClass = computed(() =>
  props.size === 'wide' ? 'max-w-xl sm:max-w-2xl' : 'max-w-sm sm:max-w-md'
)

const imageClass = computed(() =>
  props.size === 'wide' ? 'max-h-72 sm:max-h-80' : 'max-h-48 sm:max-h-56'
)
</script>

<template>
  <figure class="not-prose mx-auto my-10 text-center" :class="figureClass">
    <img
      :src="src"
      :alt="alt"
      class="mx-auto w-full object-contain object-center"
      :class="imageClass"
      loading="lazy"
    />
    <figcaption
      v-if="caption"
      class="m-0 mt-3 font-mono text-sm font-light leading-snug text-neutral-700"
    >
      {{ caption }}
    </figcaption>
  </figure>
</template>
