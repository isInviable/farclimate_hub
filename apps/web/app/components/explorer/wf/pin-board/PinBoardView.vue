<template>
  <div class="flex">
    <aside class="w-64 mr-4 border-r border-gray-200 min-h-screen p-6 shrink-0">
      <h3 class="font-semibold text-gray-800 mb-4">
        {{ $t("pins.sectionsByKind") }}
      </h3>
      <div class="space-y-2">
        <button
          v-for="cat in sidebarCategories"
          :key="cat.value"
          type="button"
          class="w-full text-left px-4 py-2 rounded-lg transition-colors"
          :class="[
            selectedKind === cat.value
              ? 'bg-neutral-500 text-white'
              : 'text-gray-700 hover:bg-gray-100',
          ]"
          @click="selectedKind = cat.value"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="truncate">{{ cat.label }}</span>
            <span class="text-sm opacity-75 shrink-0">{{ cat.count }}</span>
          </div>
        </button>
      </div>
    </aside>

    <main class="flex-1 p-8 min-w-0">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">
          {{ $t("pins.boardTitle") }}
        </h1>
        <p class="text-gray-600">
          {{ summaryLine }}
        </p>
      </div>

      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        class="mb-4"
        :title="$t('pins.loadError')"
        :description="error"
      />

      <div v-if="loading" class="flex justify-center py-16">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-10 h-10 animate-spin text-primary-500"
        />
      </div>

      <template v-else>
        <div
          v-if="flatFilteredPins.length === 0"
          class="text-center py-12">
          <Icon name="mdi:pin-off" size="4rem" class="mx-auto text-gray-400 mb-4" />
          <h3 class="text-xl font-semibold text-gray-600 mb-2">
            {{ emptyTitle }}
          </h3>
          <p class="text-gray-500">
            {{ emptyCategory }}
          </p>
        </div>

        <div v-else class="space-y-10">
          <section
            v-for="section in visibleSections"
            :key="section.bodyKind"
          >
            <h2
              class="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-neutral-200"
            >
              {{ sectionLabel(section.bodyKind) }}
              <span class="text-sm font-normal text-neutral-500 ml-2">
                ({{ section.pins.length }})
              </span>
            </h2>
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <PinBoardCard
                v-for="pin in section.pins"
                :key="pin.id"
                :pin="pin"
                :enable-selection="enableSelection"
              />
            </div>
          </section>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { HumanPinRow } from "~/types/pins";
import { groupPinsByBodyKind } from "~/utils/pinBoardSections";
import PinBoardCard from "./PinBoardCard.vue";

const props = withDefaults(
  defineProps<{
    pins: HumanPinRow[]
    loading?: boolean
    error?: string | null
    enableSelection?: boolean
    emptyAllMessage?: string
    emptyCategoryMessage?: string
  }>(),
  {
    loading: false,
    error: null,
    enableSelection: true,
    emptyAllMessage: "",
    emptyCategoryMessage: "",
  }
);

const { t, te } = useI18n();

const selectedKind = ref<string>("all");

const sections = computed(() => groupPinsByBodyKind(props.pins));

const sidebarCategories = computed(() => {
  const total = props.pins.length;
  const rows: { value: string; label: string; count: number }[] = [
    { value: "all", label: t("pins.filterAll"), count: total },
  ];
  for (const s of sections.value) {
    const key = `pins.kinds.${s.bodyKind}`;
    rows.push({
      value: s.bodyKind,
      label: te(key) ? t(key) : t("pins.kinds.unknown"),
      count: s.pins.length,
    });
  }
  return rows;
});

const visibleSections = computed(() => {
  if (selectedKind.value === "all") return sections.value;
  return sections.value.filter((s) => s.bodyKind === selectedKind.value);
});

const flatFilteredPins = computed(() =>
  visibleSections.value.flatMap((s) => s.pins)
);

function sectionLabel(kind: string): string {
  const key = `pins.kinds.${kind}`;
  return te(key) ? t(key) : t("pins.kinds.unknown");
}

const summaryLine = computed(() => {
  const n = flatFilteredPins.value.length;
  if (selectedKind.value === "all") {
    return t("pins.summaryTotal", { count: n });
  }
  return t("pins.summaryInSection", {
    count: n,
    section: sectionLabel(selectedKind.value),
  });
});

const emptyTitle = computed(() =>
  selectedKind.value === "all"
    ? t("pins.emptyBoardTitle")
    : t("pins.emptySectionTitle")
);

const emptyCategory = computed(() =>
  selectedKind.value === "all"
    ? props.emptyAllMessage || t("pins.boardEmpty")
    : props.emptyCategoryMessage || t("pins.boardEmptyCategory")
);
</script>
