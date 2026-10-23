<template>
  <div class="flex min-h-screen flex-col bg-white">
    <SiteTopBar mode="bar" />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <SiteNavOverlay />
  </div>
</template>
