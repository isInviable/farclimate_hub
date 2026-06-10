<template>
  <article class="absolute right-3 top-3 z-10 w-[300px] text-xs">
    <SidePanel
      title="regions NUTS3"
      :tot="visibleRegionCount"
      :count_active="activeRegions.size"
      :count_selected="selectedNutsIds.length"
      :default-open="true"
    >
      <template #help>
        <CaHelp title="NUTS3 regions" align="right" :w="280">
          Filter by EU NUTS level-3 region. Selecting regions includes projects with entities there;
          multiple regions use OR. Use <strong>NUTS3</strong> map mode to hover or click regions.
        </CaHelp>
      </template>
      <template #content>
        <div class="mb-3">
          <div class="mb-1 flex items-center justify-between gap-2">
            <span class="flex items-center gap-1 font-mono text-2xs uppercase tracking-widest text-neutral-dark">
              Min entities
              <CaHelp title="Min entities" align="right" :w="260">
                Hides regions with fewer than this many entities, and removes their dots from the map.
                Independent of risk/theme filters. Set to 0 to show all regions.
              </CaHelp>
            </span>
            <span class="font-mono text-[11px] text-neutral-darkest">
              {{ minEntitiesPerNuts > 0 ? `≥ ${minEntitiesPerNuts}` : "Off" }}
            </span>
          </div>
          <USlider
            v-model="minEntitiesPerNuts"
            :min="0"
            :max="maxEntitiesPerNuts"
            :step="1"
            color="primary"
          />
        </div>

        <UInput
          v-model="nutsSearch"
          icon="i-heroicons-magnifying-glass"
          size="sm"
          placeholder="Search regions…"
          class="mb-2"
        />
        <ul v-if="displayedRegions.length" class="max-h-[200px] overflow-y-auto">
          <li
            v-for="[id, name] in displayedRegions"
            :key="id"
            class="cursor-pointer border-b border-neutral-lighter py-1 transition-colors duration-200"
            :class="[
              !activeRegions.has(id) ? 'opacity-40 text-neutral-dark' : 'hover:bg-warm-neutral-100',
              selectedNutsIds.includes(id) ? 'bg-trust-blue-lightest font-semibold text-trust-blue-darkest' : '',
            ]"
            @click="toggleNuts(id)"
          >
            {{ name }} ({{ id }})
            <span class="text-neutral-dark"> — {{ entityCountByRegion.get(id) ?? 0 }}</span>
          </li>
        </ul>
        <p v-else class="py-2 text-neutral-dark">No matches</p>
      </template>
    </SidePanel>

    <div class="mt-2 border border-neutral-darkest bg-neutral-lightest p-3">
      <div class="flex justify-between gap-2">
        <p class="font-mono text-[11px] text-neutral-darkest">
          {{ hoveredNutsId ? getNutsNameById(hoveredNutsId) : "Hover over a NUTS area" }}
        </p>
        <p class="text-right font-mono text-[11px]">
          <strong class="text-trust-blue-darkest">{{ hoveredEntitiesCount }}</strong> entities
        </p>
      </div>

      <div class="mt-2 min-h-12 border-t border-neutral-lighter pt-3">
        <ul>
          <li
            v-for="nut in selectedNutsIds"
            :key="nut"
            class="font-mono text-[11px] text-neutral-dark"
          >
            {{ getNutsNameById(nut) }} ({{ nut }})
          </li>
        </ul>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { matchesSearch, sortByRelevance } from "~/utils/sortFilterList";

const props = defineProps<{
  regions: Map<string, string>;
  activeRegions: Set<string>;
  selectedNutsIds: string[];
  hoveredNutsId: string | null;
  hoveredEntitiesCount: number;
  entityCountByRegion: Map<string, number>;
  maxEntitiesPerNuts: number;
  getNutsNameById: (id: string) => string;
  toggleNuts: (id: string) => void;
}>();

const minEntitiesPerNuts = defineModel<number>("minEntitiesPerNuts", { default: 1 });

const nutsSearch = ref("");

const visibleRegionEntries = computed(() => {
  const entries = [...props.regions.entries()];
  if (minEntitiesPerNuts.value <= 0) return entries;

  return entries.filter(
    ([id]) => (props.entityCountByRegion.get(id) ?? 0) >= minEntitiesPerNuts.value
  );
});

const visibleRegionCount = computed(() => visibleRegionEntries.value.length);

const displayedRegions = computed(() => {
  const sorted = sortByRelevance(visibleRegionEntries.value, {
    isActive: ([id]) => props.activeRegions.has(id),
    isSelected: ([id]) => props.selectedNutsIds.includes(id),
    label: ([, name]) => name,
  });

  return sorted.filter(([id, name]) => matchesSearch(nutsSearch.value, name, id));
});
</script>
