<template>
  <header class="absolute left-0 right-0 top-0 z-20">
    <div class="bg-linear-to-t from-transparent to-black/60">
      <UContainer class="h-16 md:h-20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="text-neutral-lightest font-display font-bold text-xl"> <img src="/img/logo.svg" alt="Logo" class="h-6" /></NuxtLink>
        </div>
        <nav class="hidden md:flex items-center gap-10 text-neutral-lightest text-[13px] font-mono">
          <NuxtLink to="#about">About</NuxtLink>
          <NuxtLink to="/explorer/explorer">Solutions</NuxtLink>
          <NuxtLink to="#stories">Stories</NuxtLink>
          <NuxtLink to="#skills">Skills</NuxtLink>
          <NuxtLink to="/connected/dashboard">Connected Action</NuxtLink>
        </nav>
      </UContainer>
    </div>
  </header>
</template>

<script lang="ts" setup>

</script>

<style>

</style>

