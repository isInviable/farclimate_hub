<template>
  <div class="border-t border-neutral-darkest">
    <button
      type="button"
      class="flex w-full items-center px-3.5 py-2.5 text-left"
      @click="$emit('update:open', !open)"
    >
      <span class="font-mono text-[10.5px] font-bold tracking-[0.12em]">{{ title }}</span>
      <span class="flex-1" />
      <span class="font-mono text-2xs text-neutral-dark">
        {{ selected.size ? selected.size : options.length }}<span class="opacity-40"> / {{ options.length }}</span>
      </span>
      <span
        class="ml-2 inline-block font-mono text-2xs font-bold transition-transform"
        :class="open ? 'rotate-90' : ''"
      >
        ›
      </span>
    </button>
    <div v-if="open" class="max-h-[168px] overflow-y-auto px-3.5 pb-3">
      <div
        v-for="o in options"
        :key="o"
        class="flex cursor-pointer items-center gap-2.5 py-[5px]"
        @click="$emit('toggle', o)"
      >
        <span
          class="h-3 w-3 shrink-0 border border-neutral-darkest"
          :style="selected.size === 0 || selected.has(o) ? { backgroundColor: accent } : undefined"
        />
        <span
          class="font-mono text-[11px]"
          :class="selected.size === 0 || selected.has(o) ? 'font-semibold text-neutral-darkest' : 'text-neutral-dark'"
        >
          {{ o }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  options: string[];
  selected: Set<string>;
  accent: string;
  open: boolean;
}

defineProps<Props>();

defineEmits<{
  toggle: [value: string];
  "update:open": [value: boolean];
}>();
</script>
