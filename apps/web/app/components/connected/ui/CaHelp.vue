<template>
  <span
    class="relative inline-flex align-middle"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <button
      type="button"
      aria-label="Help"
      class="flex h-[18px] w-[18px] shrink-0 cursor-help items-center justify-center rounded-full border font-mono text-[10px] font-bold leading-none transition-colors"
      :class="
        open
          ? 'border-neutral-darkest bg-neutral-darkest text-neutral-lightest'
          : 'border-neutral-dark text-neutral-dark'
      "
      @click.stop="pin = !pin"
    >
      ?
    </button>
    <span
      v-if="open"
      class="absolute top-6 z-[60] border border-neutral-darkest bg-neutral-darkest p-3 text-left shadow-xl"
      :class="align === 'right' ? 'right-0' : 'left-0'"
      :style="{ width: `${w}px` }"
    >
      <span
        class="absolute -top-[5px] h-[9px] w-[9px] rotate-45 bg-neutral-darkest"
        :class="align === 'right' ? 'right-2' : 'left-2'"
      />
      <span
        v-if="title"
        class="mb-1.5 block font-mono text-[9px] font-bold tracking-[0.18em] text-neutral"
      >
        {{ title.toUpperCase() }}
      </span>
      <span class="block font-sans text-xs leading-relaxed text-neutral-lightest">
        <slot />
      </span>
    </span>
  </span>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  w?: number;
  align?: "left" | "right";
}

withDefaults(defineProps<Props>(), {
  title: undefined,
  w: 280,
  align: "left",
});

const hover = ref(false);
const pin = ref(false);
const open = computed(() => hover.value || pin.value);
</script>
