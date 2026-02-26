<script lang="ts" setup>
import { VisXYContainer, VisStackedBar, VisAxis, VisTooltip } from "@unovis/vue";
import { StackedBar } from "@unovis/ts";
import { ref, computed } from 'vue';

import type { SearchResult } from "@/types/search";

const props = defineProps<{
  results: SearchResult[];
}>();

const chartContainer = ref<HTMLElement | null>(null);

// Process the data to count implementations per year
const chartData = computed(() => {
  const yearCounts = new Map<number, number>();

  props.results.forEach((result) => {
    const year = result.implementation_years?.start_year;
    if (year) {
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    }
  });

  // Convert to array of { year, count } objects and sort by year
  return Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
});

const x = (d: { year: number; count: number }) => d.year;
const y = (d: { year: number; count: number }) => d.count;
const triggers = {
  [StackedBar.selectors.bar]: (d: { year: number; count: number }) => `
      <span>${d.year}, ${d.count}</span>
    `,
};
</script>

<template>
  <div class="relative w-full h-[300px]">
    <Pin>
      <VisXYContainer :data="chartData">
        <VisStackedBar :x="x" :y="y" :barPadding="0.1" />
        <VisAxis type="x" :tickFormat="(d: number) => d.toString()" />
        <VisAxis type="y" :tickFormat="(d: number) => d.toString()" />
        <VisTooltip :triggers="triggers" />
      </VisXYContainer>
    </Pin>
  </div>
</template>
