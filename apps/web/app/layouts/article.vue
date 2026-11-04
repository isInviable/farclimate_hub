<script setup lang="ts">
useExplorerTheme()
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-neutral-lightest">
    <SiteTopBar mode="bar" class="shrink-0" />
    <main class="flex min-h-0 flex-1 flex-col">
      <slot />
    </main>
    <SiteNavOverlay />
    <AuthRequiredModal />
  </div>
</template>
