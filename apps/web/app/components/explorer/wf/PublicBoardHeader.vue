<template>
  <header class="bg-neutral">
    <div class="w-11/12 lg:w-10/12 mx-auto py-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <img
            src="~/assets/img/farclimate_q.png"
            alt="Project Logo"
            class="h-8 w-8 mr-3"
          />
          <h1 class="font-mono text-primary-400 text-md">
            {{ projectName }}
          </h1>
        </div>
        <div class="text-xs text-primary-300">
          View only
        </div>
      </div>
    </div>
  </header>
  
</template>

<script setup lang="ts">
defineProps<{
  projectName: string
}>()
</script>


