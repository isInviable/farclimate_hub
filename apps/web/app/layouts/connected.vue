<template>
  <div class="flex min-h-screen flex-col">
    <SiteTopBar mode="bar" />
    <ConnectedHeader />
    <main class="flex min-h-0 flex-1 flex-col">
      <slot />
    </main>
    <SiteFooter />
    <SiteNavOverlay />
  </div>
</template>
