<script setup lang="ts">
const props = defineProps<{
  period: { label: string; value: string }
  status: { label: string; value: string }
  participants: { label: string; logos: string[] }
  mapImage: string
  mapAlt: string
  paragraphs: string[]
}>()
</script>

<template>
  <div class="flex flex-col gap-10">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <p class="font-mono text-xs uppercase text-neutral-dark mb-2">{{ period.label }}</p>
        <p class="font-display font-bold text-2xl text-neutral-darkest">{{ period.value }}</p>
      </div>
      <div>
        <p class="font-mono text-xs uppercase text-neutral-dark mb-2">{{ status.label }}</p>
        <p class="font-display font-bold text-2xl text-neutral-darkest">{{ status.value }}</p>
      </div>
      <div>
        <p class="font-mono text-xs uppercase text-neutral-dark mb-2">{{ participants.label }}</p>
        <div class="flex flex-wrap gap-3">
          <img
            v-for="(logo, i) in participants.logos"
            :key="i"
            :src="logo"
            alt=""
            class="h-8 object-contain"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <img :src="mapImage" :alt="mapAlt" class="w-full object-cover border border-neutral" />
      <div class="flex flex-col gap-4">
        <p
          v-for="(para, i) in paragraphs"
          :key="i"
          class="font-mono text-sm text-neutral-darkest leading-relaxed"
        >
          {{ para }}
        </p>
      </div>
    </div>
  </div>
</template>
