<template>
  <div class="relative overflow-hidden bg-white shadow-sm flex flex-col justify-between min-h-80">
    <div aria-hidden class="overflow-hidden h-48">
      <img :src="imgSrc" alt="" class="w-full h-full object-contain" />
    </div>

    <div class="px-6 pt-4">
      <h4 class="font-display font-bold text-3xl" :class="titleClass">
        {{ title }}
      </h4>
      <p class="text-sm text-neutral-800 mt-2">
        {{ description }}
      </p>
    </div>
    <div class="px-6 pb-6">
      <UButton
        :to="to"
        size="xl"
        block
        class="mt-6"
        color="primary"
        variant="subtle"
      >
        {{ buttonLabel }}
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string
  imgSrc: string
  description: string
  titleClass?: string
  buttonLabel: string
  to: string
}>()
</script>
