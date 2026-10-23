<template>
  <div class="relative flex min-h-screen flex-col bg-adapt-paper">
    <SiteTopBar mode="home" />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <SiteNavOverlay />
  </div>
</template>
