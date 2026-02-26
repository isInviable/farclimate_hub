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
  <div class="min-h-screen flex flex-col">
    <header class="border-b bg-white">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-4">
        <NuxtLink to="/" class="text-base font-semibold tracking-tight">
          FarClimate
        </NuxtLink>

        <ul class="flex items-center gap-3 text-sm">
          <li v-for="link in links" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="px-2 py-1 text-gray-600 hover:text-gray-900"
              active-class="text-primary border-b-2 border-primary"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

