<script setup lang="ts">
defineProps<{
  donuts: Array<{ value: number; label: string }>
}>()

function strokeDash(value: number) {
  const circumference = 2 * Math.PI * 40
  const filled = (value / 100) * circumference
  return `${filled} ${circumference}`
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-12">
    <div
      v-for="(donut, i) in donuts"
      :key="i"
      class="flex flex-col items-center gap-4"
    >
      <div class="relative size-32">
        <svg viewBox="0 0 100 100" class="size-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            stroke-width="12"
            class="text-neutral-lighter"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            stroke-width="12"
            stroke-linecap="round"
            class="text-community-pink-dark"
            :stroke-dasharray="strokeDash(donut.value)"
          />
        </svg>
        <span
          class="absolute inset-0 flex items-center justify-center font-display font-bold text-3xl text-neutral-darkest"
        >
          {{ donut.value }}%
        </span>
      </div>
      <p class="font-mono text-sm text-center text-neutral-darkest">{{ donut.label }}</p>
    </div>
  </div>
</template>
