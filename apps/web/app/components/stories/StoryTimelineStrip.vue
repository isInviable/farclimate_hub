<script setup lang="ts">
defineProps<{
  years: string[]
  activeYear: string
  mapImage?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-wrap gap-2">
      <span
        v-for="year in years"
        :key="year"
        class="px-4 py-2 font-mono text-sm border"
        :class="
          year === activeYear
            ? 'bg-neutral-darkest text-neutral-lightest border-neutral-darkest'
            : 'bg-white text-neutral-darkest border-neutral'
        "
      >
        {{ year }}
      </span>
    </div>
    <img
      v-if="mapImage"
      :src="mapImage"
      alt=""
      class="w-full max-h-64 object-cover border border-neutral"
    />
  </div>
</template>
