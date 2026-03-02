<template>
  <div class="relative overflow-hidden bg-neutral-white shadow-sm flex flex-col justify-between gap-3">
    <div aria-hidden class="overflow-hidden">
      <img :src="imgSrc" alt="" class="object-contain" />
    </div>

    <div class="px-6 ">
      <h4 class="relative font-display font-bold text-3xl" :class="titleClass">
        {{ title }}
      </h4>
      <p class="relative text-sm text-neutral-800">
        {{ description }}
      </p>
      </div>
      <div class="px-6 pb-6">
      <UButton size="xl" block class="mt-6" color="neutral" variant="outline">Search</UButton>
      </div>
    
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string
  imgSrc: string
  description: string
  titleClass?: string
}>()
</script>

<style>

</style>

