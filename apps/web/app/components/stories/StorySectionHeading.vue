<script setup lang="ts">
withDefaults(
  defineProps<{
    number: string
    title: string
    intro?: string
    variant?: 'light' | 'dark'
  }>(),
  { variant: 'light' }
)
</script>

<template>
  <div class="flex flex-col gap-4 items-start text-left max-w-4xl">
    <div class="flex items-baseline gap-4">
      <span
        class="font-mono text-5xl opacity-70 shrink-0"
        :class="variant === 'dark' ? 'text-neutral-light' : 'text-neutral-500'"
      >
        {{ number }}
      </span>
      <h2
        class="typo-h4"
        :class="variant === 'dark' ? 'text-neutral-lightest' : 'text-neutral-darkest'"
      >
        {{ title }}
      </h2>
    </div>
    <p
      v-if="intro"
      class="font-mono text-base"
      :class="variant === 'dark' ? 'text-neutral-light' : 'text-neutral-darkest'"
    >
      {{ intro }}
    </p>
  </div>
</template>
