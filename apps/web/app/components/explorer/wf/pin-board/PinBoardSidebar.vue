<template>
  <aside class="w-full">
    <div class="px-5 py-5">
      <h3 class="font-display font-semibold text-lg text-neutral-darkest">
        {{ $t("pins.sectionsByKind") }}
      </h3>
    </div>

    <nav class="border-t border-neutral-darkest">
      <button
        v-for="cat in categories"
        :key="cat.value"
        type="button"
        class="sidebar-row"
        :class="isKindSelected(cat.value) && 'sidebar-row-active'"
        @click="$emit('select-kind', cat.value)"
      >
        <EditorialEyebrow
          class="flex-1 truncate"
          :weight="isKindSelected(cat.value) ? 'bold' : 'medium'"
        >
          {{ cat.label }}
        </EditorialEyebrow>
        <span
          class="font-mono text-xs tabular-nums shrink-0"
          :class="isKindSelected(cat.value) ? 'text-neutral-darkest font-bold' : 'text-neutral-dark'"
        >
          {{ cat.count }}
        </span>
      </button>
    </nav>

    <div class="h-6" />

    <nav class="border-t border-neutral-darkest">
      <button
        type="button"
        class="sidebar-row"
        :class="[
          !mapEntryEnabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
          mapEntryEnabled && selectedView === 'map' && 'sidebar-row-active',
        ]"
        :disabled="!mapEntryEnabled"
        :aria-disabled="!mapEntryEnabled"
        :title="!mapEntryEnabled ? $t('pins.map.emptyTooltip') : undefined"
        @click="$emit('select-map')"
      >
        <Icon name="mdi:map-outline" class="shrink-0 mr-3 text-neutral-dark" />
        <EditorialEyebrow
          class="flex-1 truncate"
          :weight="selectedView === 'map' ? 'bold' : 'medium'"
        >
          {{ $t("pins.map.label") }}
        </EditorialEyebrow>
        <span
          class="font-mono text-xs tabular-nums shrink-0"
          :class="selectedView === 'map' ? 'text-neutral-darkest font-bold' : 'text-neutral-dark'"
        >
          {{ mapArticleCount }}
        </span>
      </button>

      <button
        type="button"
        class="sidebar-row"
        :class="selectedView === 'artifacts' && 'sidebar-row-active'"
        @click="$emit('select-artifacts')"
      >
        <Icon name="i-heroicons-archive-box" class="shrink-0 mr-3 text-neutral-dark" />
        <EditorialEyebrow
          class="flex-1 truncate"
          :weight="selectedView === 'artifacts' ? 'bold' : 'medium'"
        >
          {{ $t("podcast.artifacts.title") }}
        </EditorialEyebrow>
        <span
          class="font-mono text-xs tabular-nums shrink-0"
          :class="selectedView === 'artifacts' ? 'text-neutral-darkest font-bold' : 'text-neutral-dark'"
        >
          {{ artifactCount }}
        </span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
export interface PinBoardSidebarCategory {
  value: string;
  label: string;
  count: number;
}

const props = defineProps<{
  categories: PinBoardSidebarCategory[];
  selectedKind: string;
  selectedView: "grid" | "map" | "artifacts";
  mapEntryEnabled: boolean;
  mapArticleCount: number;
  artifactCount: number;
}>();

defineEmits<{
  (e: "select-kind", kind: string): void;
  (e: "select-map"): void;
  (e: "select-artifacts"): void;
}>();

function isKindSelected(kind: string): boolean {
  return props.selectedView === "grid" && props.selectedKind === kind;
}
</script>
