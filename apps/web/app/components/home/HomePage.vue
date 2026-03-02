<template>
  <div>
    <!-- Hero -->
    <section class="relative h-[80vh] min-h-[560px] flex items-end text-white">
      <div class="absolute inset-0 bg-[url('/img/hero.png')] bg-cover bg-center"></div>
      <div class="absolute inset-0 bg-linear-to-b from-black/60 via-black/20 to-black/60"></div>
      <UContainer class="relative z-10 pb-16">
        <div class="max-w-4xl">
          <h1 class="typo-display">
            <span class="block">Welcome to the</span>
            <span class="block">Transformation HUB</span>
          </h1>
          <p class="typo-body mt-6 max-w-2xl opacity-90">
            Learn from applied experiences, share solutions, and connect with peers tackling the same
            challenges in their territories
          </p>
          <div class="mt-8 flex items-center gap-2">
            <UButton class="btn-cta">FIND OUT MORE</UButton>
            <UButton class="btn-cta-accent" aria-label="Scroll down">
              <UIcon name="i-heroicons-arrow-down-20-solid" />
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- 01. Inspiration & Learning -->
    <section class="py-20 md:py-24 bg-white">
      <UContainer>
        <div class="flex items-baseline gap-4">
          <span class="font-mono text-2xl md:text-3xl text-neutral-400">01.</span>
          <h2 class="typo-h1 text-neutral-900">Inspiration & Learning</h2>
        </div>
        <p class="typo-body mt-6 max-w-3xl text-neutral-700 text-center md:text-left">
          We are part of a community affected by climate change, with a certain degree of technical knowledge
        </p>

        <div class="mt-12 grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10">
          <div class="md:col-span-2">
            <h3 class="typo-h4">Our problem space</h3>
          </div>
          <div class="md:col-span-3">
            <p class="typo-body text-neutral-700">
              Climate change impacts our territories in multiple ways. To better understand them, we consider three key dimensions:
            </p>
          </div>
        </div>

        <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="flex flex-col items-start gap-3">
            <div class="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
              <UIcon name="i-heroicons-fire-16-solid" class="text-neutral-700" />
            </div>
            <div>
              <p class="font-mono font-semibold">Hazard activity</p>
              <p class="typo-body text-neutral-600">Fires, droughts, floods, pests.</p>
            </div>
          </div>
          <div class="flex flex-col items-start gap-3">
            <div class="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
              <UIcon name="i-heroicons-academic-cap-16-solid" class="text-neutral-700" />
            </div>
            <div>
              <p class="font-mono font-semibold">Habitat agents</p>
              <p class="typo-body text-neutral-600">Ecosystems, species, human activities</p>
            </div>
          </div>
          <div class="flex flex-col items-start gap-3">
            <div class="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
              <UIcon name="i-heroicons-map-pin-16-solid" class="text-neutral-700" />
            </div>
            <div>
              <p class="font-mono font-semibold">Location scale</p>
              <p class="typo-body text-neutral-600">Local, regional, bioregional</p>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- 02. Economic sectors (cards) -->
    <section class="bg-neutral-200 py-20">
      <UContainer>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="bg-white p-6 shadow-sm flex flex-col gap-3">
            <h4 class="font-display font-bold text-[28px] text-[#1e63a2]">Fisheries</h4>
            <p class="text-[13px] text-neutral-800">Ocean warming, overfishing, coastal erosion</p>
            <UButton color="neutral" variant="outline">Search</UButton>
          </div>
          <div class="bg-white p-6 shadow-sm flex flex-col gap-3">
            <h4 class="font-display font-bold text-[28px] text-[#9e9e14]">Agriculture</h4>
            <p class="text-[13px] text-neutral-800">Droughts, soil degradation, pests, water scarcity</p>
            <UButton color="neutral" variant="outline">Search</UButton>
          </div>
          <div class="bg-white p-6 shadow-sm flex flex-col gap-3">
            <h4 class="font-display font-bold text-[28px] text-[#ca1768]">Forestry</h4>
            <p class="text-[13px] text-neutral-800">Fires, biodiversity loss, invasive species</p>
            <UButton color="neutral" variant="outline">Search</UButton>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<script lang="ts" setup>

</script>

<style>

</style>

