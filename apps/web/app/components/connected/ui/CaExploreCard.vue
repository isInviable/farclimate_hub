<template>
  <NuxtLinkLocale
    :to="to"
    class="group flex flex-col bg-neutral-lightest transition-colors hover:bg-warm-neutral-100"
    :style="{ '--ca-accent': accent }"
  >
    <!-- index number + glyph -->
    <div class="flex items-center gap-3 px-5 pt-[18px]">
      <span class="font-mono text-[13px] font-bold tracking-[0.1em]" :style="{ color: accent }">{{ n }}</span>
      <span
        class="inline-flex h-[30px] w-[30px] items-center justify-center border border-neutral-darkest text-[15px] text-neutral-darkest transition-colors group-hover:border-[var(--ca-accent)] group-hover:bg-[var(--ca-accent)] group-hover:text-neutral-lightest"
      >
        {{ glyph }}
      </span>
    </div>

    <!-- body -->
    <div class="flex-1 px-5 pt-3.5">
      <span class="block font-display text-[26px] font-bold leading-tight">{{ title }}</span>
      <span class="mt-1.5 block font-sans text-sm font-medium text-neutral-darker">{{ lede }}</span>
      <span class="mt-2 block font-sans text-[13.5px] leading-snug text-neutral-dark">{{ body }}</span>
      <div class="mt-3 flex flex-wrap gap-1.5">
        <span
          v-for="s in shows"
          :key="s"
          class="border border-neutral-darkest bg-neutral-lightest px-2 py-[3px] font-mono text-[9.5px] text-neutral-dark"
        >
          {{ s }}
        </span>
      </div>
    </div>

    <!-- preview footer -->
    <div
      class="mt-4 flex items-center justify-between border-t border-neutral-darkest bg-warm-neutral-100 px-5 py-3.5 transition-colors group-hover:bg-neutral-lightest"
    >
      <CaMiniPreview :id="id" :accent="accent" />
      <span class="font-mono text-2xs font-bold tracking-[0.1em]">
        <span class="group-hover:hidden">VIEW</span>
        <span class="hidden group-hover:inline">OPEN →</span>
      </span>
    </div>
  </NuxtLinkLocale>
</template>

<script setup lang="ts">
interface Props {
  id: string;
  n: string;
  glyph: string;
  accent: string;
  title: string;
  lede: string;
  body: string;
  shows: string[];
  to: string;
}

defineProps<Props>();
</script>
