<script setup lang="ts">
useExplorerTheme()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-neutral-lightest">
    <SiteTopBar mode="bar" />
    <main class="flex min-h-0 flex-1 flex-col">
      <slot />
    </main>
    <SiteFooter />
    <SiteNavOverlay />
    <AuthRequiredModal />
  </div>
</template>
