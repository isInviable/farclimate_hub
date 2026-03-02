<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  backgroundImage: string
}>()
</script>

<template>
  <section class="relative min-h-[480px] flex items-end pb-0 overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <img
        :src="backgroundImage"
        alt=""
        class="absolute w-full h-full object-cover object-center"
      />
      <div class="absolute inset-0 bg-linear-to-b from-transparent from-23% to-neutral-darkest to-73%" />
    </div>

    <div class="relative w-full px-20 pb-16 pt-32 grid grid-cols-2 gap-8">
      <h1 class="font-display font-bold text-[52px] leading-[1.2] tracking-tight text-neutral-lightest">
        {{ title }}
      </h1>
      <p class="font-mono font-normal text-base leading-relaxed text-white self-end">
        {{ subtitle }}
      </p>
    </div>
  </section>
</template>
