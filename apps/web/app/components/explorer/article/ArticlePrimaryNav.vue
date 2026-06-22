<template>
  <div
    role="tablist"
    aria-orientation="horizontal"
    class="article-primary-nav flex flex-wrap items-baseline gap-x-6 gap-y-2 select-none"
  >
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="item.id === activeId"
      :aria-controls="ariaControlsFor(item.id)"
      :tabindex="item.id === activeId ? 0 : -1"
      class="font-display inline-flex items-center gap-2 rounded-sm text-base font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:text-lg"
      :class="
        item.id === activeId
          ? 'cursor-default text-neutral-darkest'
          : 'cursor-pointer text-primary-600 hover:text-primary-700'
      "
      @click="handleClick(item.id)"
    >
      <span>{{ item.label }}</span>
      <UBadge
        v-if="item.badgeCount && item.badgeCount > 0"
        color="error"
        variant="solid"
        size="sm"
        class="min-w-5 justify-center"
      >
        {{ item.badgeCount }}
      </UBadge>
    </button>
  </div>
</template>

<script setup lang="ts">
export interface ArticlePrimaryNavItem {
  id: string;
  label: string;
  badgeCount?: number;
}

const props = withDefaults(
  defineProps<{
    items: ArticlePrimaryNavItem[];
    activeId: string;
    panelIdPrefix?: string;
  }>(),
  { panelIdPrefix: "article-primary" },
);

const emit = defineEmits<{
  (e: "update:activeId", id: string): void;
}>();

function ariaControlsFor(id: string): string {
  return `${props.panelIdPrefix}-${id}`;
}

function handleClick(id: string): void {
  if (id === props.activeId) return;
  emit("update:activeId", id);
}
</script>
