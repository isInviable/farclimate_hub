<template>
  <div
    :class="[
      'flex flex-col items-center justify-center text-center',
      standalone
        ? 'col-span-full min-h-[600px] py-16'
        : 'absolute inset-0 z-10 bg-neutral-darkest/40 pointer-events-auto',
    ]"
    role="status"
    aria-live="polite"
  >
    <div
      :class="[
        'mb-5 flex items-center justify-center',
        standalone
          ? 'size-20 rounded-full border border-neutral-darkest bg-neutral-lighter'
          : 'bg-neutral-lighter rounded-full p-10 absolute top-20  translate-x-1/2',
      ]"
      aria-hidden="true"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-10 animate-spin"
        :class="standalone ? 'text-neutral-dark' : 'text-neutral-darkest'"
      />
    </div>
    <h3 class="font-display text-xl font-bold text-neutral-darkest" >
      {{ $t("common.searching") }}
    </h3>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  standalone?: boolean;
}>();
</script>
