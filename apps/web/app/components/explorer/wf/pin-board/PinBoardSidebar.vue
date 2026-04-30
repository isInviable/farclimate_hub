<template>
  <aside class="w-64 mr-4 border-r border-gray-200 min-h-screen p-6 shrink-0">
    <h3 class="font-semibold text-gray-800 mb-4">
      {{ $t("pins.sectionsByKind") }}
    </h3>

    <div class="space-y-2">
      <button
        v-for="cat in categories"
        :key="cat.value"
        type="button"
        class="w-full text-left px-4 py-2 rounded-lg transition-colors"
        :class="[
          isKindSelected(cat.value)
            ? 'bg-neutral-500 text-white'
            : 'text-gray-700 hover:bg-gray-100',
        ]"
        @click="$emit('select-kind', cat.value)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="truncate">{{ cat.label }}</span>
          <span class="text-sm opacity-75 shrink-0">{{ cat.count }}</span>
        </div>
      </button>
    </div>

    <div class="mt-6 pt-4 border-t border-gray-200 space-y-2">
      <button
        type="button"
        class="w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between gap-2"
        :class="[
          !mapEntryEnabled
            ? 'text-gray-400 cursor-not-allowed'
            : selectedView === 'map'
              ? 'bg-neutral-500 text-white'
              : 'text-gray-700 hover:bg-gray-100',
        ]"
        :disabled="!mapEntryEnabled"
        :aria-disabled="!mapEntryEnabled"
        :title="!mapEntryEnabled ? $t('pins.map.emptyTooltip') : undefined"
        @click="$emit('select-map')"
      >
        <span class="flex items-center gap-2 truncate">
          <Icon name="mdi:map-outline" class="shrink-0" />
          <span class="truncate">{{ $t("pins.map.label") }}</span>
        </span>
        <span class="text-sm opacity-75 shrink-0">{{ mapArticleCount }}</span>
      </button>

      <button
        type="button"
        class="w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between gap-2"
        :class="[
          selectedView === 'artifacts'
            ? 'bg-neutral-500 text-white'
            : 'text-gray-700 hover:bg-gray-100',
        ]"
        @click="$emit('select-artifacts')"
      >
        <span class="flex items-center gap-2 truncate">
          <Icon name="i-heroicons-archive-box" class="shrink-0" />
          <span class="truncate">{{ $t("podcast.artifacts.title") }}</span>
        </span>
        <span class="text-sm opacity-75 shrink-0">{{ artifactCount }}</span>
      </button>
    </div>
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
