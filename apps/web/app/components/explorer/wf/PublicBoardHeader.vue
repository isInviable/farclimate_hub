<template>
  <header class="border-b border-neutral-darkest bg-neutral-lightest">
    <div class="flex h-14 items-center gap-3 px-6">
      <span class="size-7 shrink-0 bg-adapt-orange" aria-hidden="true" />
      <span class="hidden font-mono text-2xs font-bold uppercase tracking-[0.18em] text-neutral-dark sm:inline">
        {{ $t('projects.header.project') }}
      </span>
      <span class="hidden h-5 w-px bg-neutral-darkest/20 sm:inline-block" aria-hidden="true" />
      <h1 class="truncate font-display text-[20px] font-bold leading-none text-neutral-darkest">
        {{ projectName }}
      </h1>
      <span class="h-5 w-0.5 bg-adapt-orange" aria-hidden="true" />
      <div class="flex-1" />
      <span class="font-mono text-2xs font-bold uppercase tracking-[0.14em] text-neutral-dark">
        View only
      </span>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  projectName: string
}>()
</script>
