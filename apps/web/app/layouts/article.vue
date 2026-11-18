<script setup lang="ts">
useExplorerTheme()
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-neutral-lightest">
    <SiteTopBar mode="bar" class="shrink-0" />
    <main class="flex flex-1 flex-col">
      <slot />
    </main>
    <SiteFooter />

    <SiteNavOverlay />
    <AuthRequiredModal />
  </div>
</template>
