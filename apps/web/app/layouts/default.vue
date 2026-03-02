<script setup lang="ts">
interface NavLink {
  label: string
  to: string
}

const links: NavLink[] = [
  { label: 'Home', to: '/' },
  { label: 'Explorer', to: '/explorer' },
  { label: 'Connected', to: '/connected/dashboard' },
  { label: 'Admin', to: '/admin' }
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-neutral-lightest">
   <SiteHeader />
    

    <main class="flex-1">
      <slot />
    </main>
  </div>
  <SiteFooter />
</template>

