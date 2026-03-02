<template>
  <div>
    <!-- Hero -->
    <section class="relative h-[80vh] min-h-[560px] flex items-center text-white inset-0 bg-[url('/img/hero.png')] bg-cover bg-center" 
    >
      
      
      <UContainer class="relative z-10 pt-16">
        <div class="text-center">
          <h1 class="typo-display">
            <span class="block">Welcome to the</span>
            <span class="block">Transformation HUB</span>
          </h1>
          <p class="font-textmediumnormal mt-6  opacity-90">
            Learn from applied experiences, share solutions, and connect with
            peers tackling the same challenges in their territories
          </p>
          <div class="mt-8 flex items-center gap-2 justify-center">
            <UFieldGroup>
              <UButton color="neutral" variant="outline" size="xl">FIND OUT MORE</UButton>
              <UButton color="primary" aria-label="Scroll down" size="xl">
                <UIcon name="material-symbols:arrow-downward" />
              </UButton>
            </UFieldGroup>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- 01. Inspiration & Learning -->
    <section class="py-20 md:py-24 bg-white">
      <UContainer>
        <div class="flex items-baseline gap-4">
          <span class="text-neutral-dark font-mono! text-6xl t">01.</span>
          <h2 class="typo-h1 text-neutral-900">Inspiration & Learning</h2>
        </div>
        <p class="font-textmediumnormal mt-6 text-neutral-700 text-center">
          We are part of a community affected by climate change, with a certain
          degree of technical knowledge
        </p>

        <div class="mt-28 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="md:col-span-1">
            <h3 class="typo-h4">Our problem space</h3>
          </div>
          <div class="md:col-span-2">
            <p class="typo-body text-neutral-700">
              Climate change impacts our territories in multiple ways. To better
              understand them, we consider three key dimensions:
            </p>
          </div>
        </div>

        <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="flex flex-col items-start gap-3">
            <img
              src="/img/icons/hazard.svg"
              alt="Hazard activity"
              class="w-24 h-24"
            />
            <div>
              <p class="font-mono font-semibold">Hazard activity</p>
              <p class="font-textsmalllight">Fires, droughts, floods, pests.</p>
            </div>
          </div>
          <div class="flex flex-col items-start gap-3">
            <img
              src="/img/icons/habitat.svg"
              alt="Habitat agents"
              class="w-24 h-24"
            />
            <div>
              <p class="font-mono font-semibold">Habitat agents</p>
              <p class="font-textsmalllight">
                Ecosystems, species, human activities
              </p>
            </div>
          </div>
          <div class="flex flex-col items-start gap-3">
            <img
              src="/img/icons/location.svg"
              alt="Location scale"
              class="w-24 h-24"
            />
            <div>
              <p class="font-mono font-semibold">Location scale</p>
              <p class="font-textsmalllight">Local, regional, bioregional</p>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- 02. Economic sectors (cards) -->
    <section class="bg-neutral-lighter py-20">
      <UContainer>
        <!-- Title row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div class="md:col-span-1">
            <h3 class="typo-h4">Economic sectors</h3>
          </div>
          <div class="md:col-span-2">
            <p class="typo-body text-neutral-700">
              Currently, the platform focuses on three economic sectors where
              these impacts are most visible. In the future, new economic
              sectors will be added as climate impacts spread and adaptation
              needs evolve
            </p>
          </div>
        </div>

        <!-- Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <HomeCard
            title="Fisheries"
            img-src="/img/fisheries@2x.png"
            description="Ocean warming, overfishing, coastal erosion"
            title-class="text-trust-blue-darkest"
          />
          <HomeCard
            title="Agriculture"
            img-src="/img/agriculture@2x.png"
            description="Droughts, soil degradation, pests, water scarcity"
            title-class="text-grounded-green-dark"
          />
          <HomeCard
            title="Forestry"
            img-src="/img/forestry@2x.png"
            description="Fires, biodiversity loss, invasive species"
            title-class="text-community-pink-darkest"
          />
        </div>
      </UContainer>
    </section>
  </div>
</template>

<script lang="ts" setup>
import HomeCard from '~/components/home/HomeCard.vue';
</script>

<style></style>
