<template>
  <header
    :class="mode ? 'absolute left-0 right-0 top-0 z-20' : 'relative z-20 w-full'"
  >
    <div
      :class="
        mode
          ? 'bg-linear-to-t from-transparent to-black/60'
          : 'bg-neutral-lightest'
      "
    >
      <UContainer class="h-16 md:h-20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/"
            class="font-display font-bold text-xl"
          >
            <img src="/img/logo.svg" alt="Logo" class="h-6" v-if="mode" />
            <div class="font-display font-bold text-xs" v-else>
              FarClimate <br /> Transformation Hub
            </div>
          </NuxtLink>
        </div>
        <nav
          class="hidden md:flex items-center gap-10 text-[13px] font-mono"
          :class="mode ? 'text-neutral-lightest' : 'text-neutral-darkest'"
        >
          <NuxtLink to="#about">About</NuxtLink>
          <NuxtLink to="/explorer/explorer">Solutions</NuxtLink>
          <NuxtLink to="#stories">Stories</NuxtLink>
          <NuxtLink to="/skills">Skills</NuxtLink>
          <NuxtLink to="/connected/dashboard">Connected Action</NuxtLink>
        </nav>
      </UContainer>
    </div>
  </header>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    mode?: boolean;
  }>(),
  {
    mode: false,
  }
);
</script>

<style></style>
