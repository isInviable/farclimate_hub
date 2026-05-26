<template>
  <section class="mt-14 border-t border-neutral-darkest pt-10">
    <EditorialEyebrow class="mb-6 block" color="muted">
      {{ $t('projects.stats.overview') }}
    </EditorialEyebrow>
    <h2 class="font-display text-2xl font-bold text-neutral-darkest">
      {{ $t('projects.stats.title') }}
    </h2>
    <div
      class="editorial-frame mt-8 grid grid-cols-1 md:grid-cols-3"
    >
      <div
        class="editorial-cell flex items-center gap-4 p-6"
      >
        <div
          class="flex size-12 shrink-0 items-center justify-center bg-trust-blue-lightest"
          aria-hidden="true"
        >
          <UIcon
            name="i-heroicons-folder"
            class="size-7 text-trust-blue-darkest"
          />
        </div>
        <div class="min-w-0 text-left">
          <p class="font-mono text-2xs font-bold uppercase tracking-[0.14em] text-neutral-dark">
            {{ $t('projects.stats.totalProjects') }}
          </p>
          <p class="font-display text-3xl font-bold text-neutral-darkest">
            {{ totalProjects }}
          </p>
        </div>
      </div>
      <div
        class="editorial-cell flex items-center gap-4 p-6"
      >
        <div
          class="flex size-12 shrink-0 items-center justify-center bg-grounded-green-lightest"
          aria-hidden="true"
        >
          <UIcon name="mdi:pin" class="size-7 text-grounded-green-darkest" />
        </div>
        <div class="min-w-0 text-left">
          <p class="font-mono text-2xs font-bold uppercase tracking-[0.14em] text-neutral-dark">
            {{ $t('projects.stats.totalPins') }}
          </p>
          <p class="font-display text-3xl font-bold text-neutral-darkest">
            {{ totalPins }}
          </p>
        </div>
      </div>
      <div
        class="editorial-cell flex items-center gap-4 p-6"
      >
        <div
          class="flex size-12 shrink-0 items-center justify-center bg-resilient-yellow-lightest"
          aria-hidden="true"
        >
          <UIcon
            name="i-heroicons-star"
            class="size-7 text-resilient-yellow-darkest"
          />
        </div>
        <div class="min-w-0 text-left">
          <p class="font-mono text-2xs font-bold uppercase tracking-[0.14em] text-neutral-dark">
            {{ $t('projects.dashboard.mostPinnedProject') }}
          </p>
          <p
            class="font-display text-lg font-semibold text-neutral-darkest truncate"
            :title="mostActiveName || undefined"
          >
            {{ mostActiveName || $t('projects.stats.notAvailable') }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  totalProjects: number;
  totalPins: number;
  mostActiveName: string | null;
}>();
</script>
