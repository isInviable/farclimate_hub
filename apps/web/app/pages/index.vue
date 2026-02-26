<script setup lang="ts">
definePageMeta({
  layout: 'default'
})
</script>

<template>
  <section class="min-h-screen bg-gray-50">
    <div class="mx-auto max-w-5xl px-4 py-16 space-y-12">
      <header class="space-y-4 text-center">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900">
          FarClimate
        </h1>
        <p class="mx-auto max-w-2xl text-base text-gray-600">
          Explore climate adaptation data, interact with the connected network of projects and entities,
          and discover insights through interactive visualizations.
        </p>
      </header>

      <div class="grid gap-6 md:grid-cols-3">
        <NuxtLink
          to="/explorer"
          class="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md"
        >
          <h2 class="mb-2 text-lg font-semibold text-gray-900">
            Data Explorer
          </h2>
          <p class="text-sm text-gray-600">
            Browse and filter climate adaptation solutions and related content.
          </p>
        </NuxtLink>

        <NuxtLink
          to="/connected/dashboard"
          class="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md"
        >
          <h2 class="mb-2 text-lg font-semibold text-gray-900">
            Connected Dashboard
          </h2>
          <p class="text-sm text-gray-600">
            Visualize the network of projects, entities, and themes across Europe.
          </p>
        </NuxtLink>

        <NuxtLink
          to="/admin"
          class="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md"
        >
          <h2 class="mb-2 text-lg font-semibold text-gray-900">
            Admin tools
          </h2>
          <p class="text-sm text-gray-600">
            Manage entities, projects, products and reference data.
          </p>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

