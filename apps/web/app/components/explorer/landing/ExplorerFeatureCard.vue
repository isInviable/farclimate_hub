<script setup lang="ts">
defineProps<{
  title: string
  description: string
  image: string
}>()
</script>

<template>
  <article class="bg-white border border-neutral flex flex-col h-full overflow-hidden">
    <div class="relative h-48 shrink-0 overflow-hidden bg-neutral-lightest">
      <img
        :src="image"
        alt=""
        class="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div
        class="absolute inset-0 bg-linear-to-b from-transparent from-0% to-neutral-darkest/40 to-100%"
        aria-hidden="true"
      />
    </div>
    <div class="flex flex-col gap-3 p-6 flex-1">
      <h3 class="font-display font-bold text-xl text-neutral-darkest">
        {{ title }}
      </h3>
      <p class="font-mono text-sm font-light text-neutral-darkest leading-relaxed">
        {{ description }}
      </p>
    </div>
  </article>
</template>
