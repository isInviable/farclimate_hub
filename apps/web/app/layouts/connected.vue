<template>
  <div class="min-h-screen flex flex-col">
    <SiteHeader />
    <!-- Push content below the absolute-positioned SiteHeader (h-16 mobile / h-20 md+) -->
    <div class="pt-16 md:pt-20 flex flex-col flex-1">
      <ConnectedHeader />
      <main class="flex-1">
        <slot />
      </main>
        <SiteFooter />

    </div>
  </div>
</template>
