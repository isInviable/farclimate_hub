<template>
  <div
    role="tablist"
    aria-orientation="vertical"
    class="rolling-menu flex flex-col items-start gap-0 select-none"
  >
    <button
      v-for="(item, idx) in arrangedItems"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="item.id === activeId"
      :aria-controls="ariaControlsFor(item.id)"
      :tabindex="item.id === activeId ? 0 : -1"
      class="text-left font-display  transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm"
      :class="
        item.id === activeId
          ? 'text-black font-bold text-2xl md:text-3xl leading-tight cursor-default'
          : 'text-primary-600 hover:text-primary-600 font-bold text-md md:text-base cursor-pointer'
      "
      :data-position="idx === arrangedItems.length - 1 ? 'active' : 'inactive'"
      @click="handleClick(item.id)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Item {
  id: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    items: Item[];
    activeId: string;
    /** Optional prefix used to construct `aria-controls` identifiers. */
    panelIdPrefix?: string;
  }>(),
  { panelIdPrefix: "rolling-panel" },
);

const emit = defineEmits<{
  (e: "update:activeId", id: string): void;
}>();

// "Rolling" rule: keep canonical relative order of inactive items, then place
// the active item at the bottom. Implemented as `items.filter(!active)` + active.
const arrangedItems = computed<Item[]>(() => {
  const active = props.items.find((i) => i.id === props.activeId);
  const inactive = props.items.filter((i) => i.id !== props.activeId);
  return active ? [...inactive, active] : props.items;
});

function ariaControlsFor(id: string): string {
  return `${props.panelIdPrefix}-${id}`;
}

function handleClick(id: string): void {
  if (id === props.activeId) return;
  emit("update:activeId", id);
}
</script>
