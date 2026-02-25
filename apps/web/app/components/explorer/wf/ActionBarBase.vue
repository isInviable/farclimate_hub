<template>
  <div class="fixed bottom-4 left-1/2 -translate-x-1/2 w-auto max-w-4xl z-50 transition-all duration-300">
    <div class="bg-slate-800 text-white rounded-full shadow-lg flex items-center justify-between p-2 gap-4">
      <div class="pl-4">
        <slot name="left" />
      </div>

      <div class="flex items-center gap-2 mr-4">
        <slot />
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
// Pure layout shell for action bars
</script>


