<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-neutral-lightest">
    <SiteHeader :mode="false" class="shrink-0" />
    <main class="flex min-h-0 flex-1 flex-col">
      <slot />
    </main>
    <AuthRequiredModal />
  </div>
</template>
