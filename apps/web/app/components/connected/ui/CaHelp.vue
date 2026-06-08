<template>
  <UTooltip
    :open="open"
    :content="{
      side: 'bottom',
      align: align === 'right' ? 'end' : 'start',
      sideOffset: 8,
    }"
    arrow
    :disable-hoverable-content="false"
    :ui="tooltipUi"
    @update:open="onOpenChange"
  >
    <button
      type="button"
      aria-label="Help"
      class="inline-flex h-[18px] w-[18px] shrink-0 cursor-help items-center justify-center rounded-full border font-mono text-[10px] font-bold leading-none transition-colors"
      :class="
        open
          ? 'border-neutral-darkest bg-neutral-darkest text-neutral-lightest'
          : 'border-neutral-dark text-neutral-dark'
      "
      @click.stop="togglePin"
    >
      ?
    </button>

    <template #content>
      <div :style="{ width: `${w}px` }">
        <p
          v-if="title"
          class="mb-1.5 font-mono text-[9px] font-bold tracking-[0.18em] text-neutral uppercase"
        >
          {{ title }}
        </p>
        <div class="font-sans text-xs leading-relaxed text-neutral-lightest">
          <slot />
        </div>
      </div>
    </template>
  </UTooltip>
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

const tooltipUi = {
  content:
    "flex flex-col items-stretch gap-0 rounded-none border border-neutral-darkest bg-neutral-darkest p-3 text-left shadow-xl h-auto max-w-none ring-0 text-neutral-lightest",
  text: "hidden",
  arrow: "fill-neutral-darkest",
};

const pinned = ref(false);
const open = ref(false);

function onOpenChange(next: boolean) {
  if (!next && pinned.value) return;
  open.value = next;
}

function togglePin() {
  pinned.value = !pinned.value;
  if (pinned.value) {
    open.value = true;
  }
}
</script>
