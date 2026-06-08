<template>
  <div class="border-b border-neutral-darkest bg-warm-neutral-100">
    <div class="mx-auto max-w-[1320px] px-7 pt-8">
      <span class="font-mono text-[11px] font-bold tracking-[0.2em] text-trust-blue-darkest">
        {{ n }} · {{ kicker }}
      </span>
      <div class="mt-4 flex flex-wrap items-end gap-4">
        <h1 class="font-display text-5xl font-bold leading-[1.04] tracking-tight">{{ title }}</h1>
        <slot name="extra" />
      </div>
      <div class="flex max-w-[760px] items-start gap-2.5 py-4 pb-5">
        <p class="font-sans text-[15px] leading-snug text-neutral-darker">{{ intro }}</p>
        <CaHelp v-if="help" :title="helpTitle" :w="300" class="mt-px">{{ help }}</CaHelp>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  n: string;
  kicker: string;
  title: string;
  intro: string;
  helpTitle?: string;
  help?: string;
}

defineProps<Props>();
</script>
