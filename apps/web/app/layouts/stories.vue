<script setup lang="ts">
const { toggle } = useSiteNav()
</script>

<template>
  <div class="relative flex min-h-screen flex-col bg-adapt-paper">
    <button
      type="button"
      class="fixed top-5 right-6 z-40 flex h-11 w-11 flex-col justify-between py-1"
      :aria-label="$t('siteNav.open')"
      @click="toggle"
    >
      <span class="block h-1.5 w-full rounded-sm bg-adapt-yellow" />
      <span class="block h-1.5 w-full rounded-sm bg-adapt-yellow" />
      <span class="block h-1.5 w-full rounded-sm bg-adapt-yellow" />
      <span class="block h-1.5 w-full rounded-sm bg-adapt-yellow" />
    </button>
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <SiteNavOverlay />
  </div>
</template>
