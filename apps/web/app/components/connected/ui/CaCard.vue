<template>
  <section class="border border-neutral-darkest bg-neutral-lightest">
    <header
      v-if="title || $slots.help || $slots.right"
      class="flex items-center gap-2.5 border-b border-neutral-darkest px-5 py-4"
    >
      <span v-if="title" class="font-mono text-xs font-bold tracking-[0.06em]">
        {{ title.toUpperCase() }}
      </span>
      <slot name="help" />
      <span class="flex-1" />
      <slot name="right" />
    </header>
    <div :class="bodyClass">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  bodyClass?: string;
}

withDefaults(defineProps<Props>(), {
  title: undefined,
  bodyClass: "p-5",
});
</script>
