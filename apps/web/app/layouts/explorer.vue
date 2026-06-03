<template>
  <div class="min-h-screen flex flex-col">
    <SiteHeader :mode="false" />
    <!-- Push content below the absolute-positioned SiteHeader (h-16 mobile / h-20 md+) -->
    <div class="">
      <main class="flex-1 flex flex-col min-h-0">
        <slot />
      </main>
        <SiteFooter />

    </div>
    <AuthRequiredModal />
  </div>
</template>
