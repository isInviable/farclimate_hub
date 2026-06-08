<template>
  <NuxtLinkLocale
    :to="to"
    class="group block border border-neutral-darkest bg-neutral-lightest p-5 transition-colors hover:bg-warm-neutral-100"
    :style="{ '--ca-accent': accent }"
  >
    <div class="flex items-center">
      <span class="font-mono text-[11px] font-bold tracking-[0.16em] text-neutral-dark">
        {{ label.toUpperCase() }}
      </span>
      <span class="flex-1" />
      <span
        class="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-neutral-darkest text-sm transition-colors group-hover:border-[var(--ca-accent)] group-hover:bg-[var(--ca-accent)] group-hover:text-neutral-lightest"
      >
        →
      </span>
    </div>
    <span class="mt-2.5 block font-display text-6xl font-bold" :style="{ color: accent }">
      {{ formatted }}
    </span>
  </NuxtLinkLocale>
</template>

<script setup lang="ts">
interface Props {
  label: string;
  value: number;
  accent: string;
  to: string;
}

const props = defineProps<Props>();

const formatted = computed(() =>
  new Intl.NumberFormat("en-US").format(props.value),
);
</script>
