<script setup lang="ts">
defineProps<{
  label: string
  to: string
  image: string
}>()
</script>

<template>
  <NuxtLinkLocale :to="to" class="inline-flex items-center gap-4">
    <img :src="image" alt="" class="h-24 w-auto" />
    <span class="max-w-40 font-adapt-heavy text-xl leading-tight tracking-tight text-adapt-orange uppercase">
      {{ label }}
    </span>
  </NuxtLinkLocale>
</template>
