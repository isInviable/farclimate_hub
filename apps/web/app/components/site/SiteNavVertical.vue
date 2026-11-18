<script setup lang="ts">
const { items, isActive } = useSiteNav()
</script>

<template>
  <nav aria-label="ADAPTARIUM" class="flex h-full min-h-dvh flex-col">
    <NuxtLinkLocale
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      class="flex flex-1 items-center justify-center px-4 text-center font-adapt-keyword text-xl tracking-wide uppercase"
      :class="[
        item.bgClass,
        item.textClass,
        isActive(item.to) ? 'outline-4 outline-offset-[-8px] outline-adapt-ink' : '',
      ]"
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      {{ $t(item.labelKey) }}
    </NuxtLinkLocale>
  </nav>
</template>
