<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Global Header -->
    <DeliverableHeader project-name="Climate Adaptation Solutions" />
    
    <div class="p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4 text-gray-800">
          Climate Adaptation Solutions
        </h1>
       
      </div>

      <!-- Explanation Section -->
      <div class="bg-white rounded-lg shadow-sm p-8 mb-12">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800">
          About This Platform
        </h2>
        <div class="prose prose-gray max-w-none">
          <p class="text-gray-600 mb-4">
            This platform serves as a comprehensive resource for climate
            adaptation professionals, researchers, and policymakers seeking
            evidence-based solutions to climate challenges. We have curated
            solutions from forestry, fishery, and agriculture sectors, each
            offering unique approaches to building climate resilience.
          </p>
      
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        <UButton
          :to="{ path: '/explorer/explorer', query: { sector: 'forestry' } }"
          size="lg"
          color="neutral"
          variant="outline"
          
          block
        >
          <template #leading>
            <UIcon name="material-symbols-light:forest" class="w-6 h-6" />
          </template>
          Forestry
        </UButton>

        <UButton
          :to="{ path: '/explorer/explorer', query: { sector: 'fishery' } }"
          size="lg"
          color="neutral"
          variant="outline"
          
          block
        >
          <template #leading>
            <UIcon name="material-symbols-light:set-meal-outline-sharp" class="w-6 h-6" />
          </template>
          Fishery
        </UButton>

        <UButton
          :to="{ path: '/explorer/explorer', query: { sector: 'agriculture' } }"
          size="lg"
          color="neutral"
          variant="outline"
          
          block
        >
          <template #leading>
            <UIcon name="material-symbols-light:nest-eco-leaf" class="w-6 h-6" />
          </template>
          Agriculture
        </UButton>
      </div>
      <div class="mt-6 flex justify-center">
          <UButton
            :to="{ path: '/explorer/explorer', query: { sector: 'all' } }"
            size="lg"
            color="neutral"
            variant="solid" 
            class="justify-center grow"    
            
          >
            <template #leading>
              <UIcon name="material-symbols-light:globe" class="w-6 h-6" />
            </template>
            View All
          </UButton>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-8 mb-12 mt-12">
        <div class="relative">
            You can start with a text search too:
        </div>
        <div class="flex justify-center gap-2">
          <UInput
            icon="i-lucide-search"
            size="md"
            variant="outline"
            placeholder="Search..."
            v-model="searchQuery"
          />
          <UButton
            icon="i-lucide-search"
            size="md"
            variant="outline"
            color="neutral"
            :to="{ path: '/explorer/explorer', query: { query: searchQuery } }"
          >
            <template #leading>
              <UIcon name="material-symbols-light:search" class="w-6 h-6" />
            </template>
            Search
          </UButton>
        </div>

      </div>

      

      <!-- Additional Info -->
      <div class="mt-12 text-center">
        <p class="text-sm text-gray-500">
          Click on any sector above to explore specific adaptation solutions, or
          view all solutions across sectors for a comprehensive overview.
        </p>
      </div>
    </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const searchQuery = ref("");

// Page metadata
definePageMeta({
  title: "Climate Adaptation Solutions",
  description:
    "Explore comprehensive climate adaptation strategies across forestry, fishery, and agriculture sectors.",
});

// SEO head
useHead({
  title: "Climate Adaptation Solutions - Deliverable 1",
  meta: [
    {
      name: "description",
      content:
        "Explore comprehensive climate adaptation strategies across different sectors including forestry, fishery, and agriculture.",
    },
  ],
});
</script>

<style scoped>
/* Custom styles if needed */
.prose {
  line-height: 1.7;
}
</style>
