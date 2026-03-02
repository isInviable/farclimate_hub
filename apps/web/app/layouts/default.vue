<script setup lang="ts">
interface NavLink {
  label: string
  to: string
}


</script>

<template>
  <div class="min-h-screen flex flex-col bg-neutral-lightest">
   <SiteHeader :mode="true" />
    

    <main class="flex-1">
      <slot />
    </main>
  </div>
  <SiteFooter />
</template>

