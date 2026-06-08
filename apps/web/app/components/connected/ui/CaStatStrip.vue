<template>
  <div class="flex flex-row w-fit max-w-full  border border-neutral-darkest bg-neutral-lightest col-span-3 flex-wrap gap-6 ">
    <button
      v-for="(item, i) in items"
      :key="item.label"
      type="button"
      class="group relative px-7 py-4 text-left transition-colors hover:bg-warm-neutral-100"
      :class="[
        i ? 'border-l border-neutral-darkest' : '',
        item.items?.length ? 'cursor-pointer' : 'cursor-default',
      ]"
      :style="{ '--ca-accent': item.accent }"
      @click="item.items?.length ? openDetail(item) : undefined"
    >
      <span class="block font-display text-4xl font-bold" :style="{ color: item.accent }">
        {{ format(item.value) }}
      </span>
      <span class="flex items-center gap-2">
        <span class="font-mono text-2xs font-semibold tracking-[0.16em] text-neutral-dark">
          {{ item.label.toUpperCase() }}
        </span>
        <span
          v-if="item.items?.length"
          class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-darkest text-[10px] opacity-0 transition-opacity group-hover:border-[var(--ca-accent)] group-hover:bg-[var(--ca-accent)] group-hover:text-neutral-lightest group-hover:opacity-100"
        >
          →
        </span>
      </span>
    </button>
  </div>

  <USlideover v-model:open="slideoverOpen" :title="activeItem?.label ?? ''">
    <template #body>
      <BANDetail
        v-if="activeItem"
        :type="activeItem.label"
        :items="activeItem.items ?? []"
        :formatter="activeItem.formatter"
      />
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import BANDetail from "../dashboard/BANDetail.vue";

export interface CaStatStripItem {
  label: string;
  value: number;
  accent: string;
  items?: unknown[];
  formatter?: (d: number) => string;
}

interface Props {
  items: CaStatStripItem[];
}

defineProps<Props>();

const slideoverOpen = ref(false);
const activeItem = ref<CaStatStripItem | null>(null);

function format(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function openDetail(item: CaStatStripItem): void {
  activeItem.value = item;
  slideoverOpen.value = true;
}
</script>
