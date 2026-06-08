<script setup lang="ts">
import { scaleLinear, max, min } from "d3";
import { useElementSize } from "@vueuse/core";

const props = defineProps({
  data: {
    type: Array as PropType<Array<{ id: number; label: string; years: Array<{ year: number; count: number }> }>>,
    required: true,
  },
  rowHeight: {
    type: Number,
    default: 80,
  },
  hasFilteredData: {
    type: Boolean,
    default: false,
  },
});

const containerRef = ref<HTMLElement | null>(null);
const { width: containerWidth, height: containerHeight } = useElementSize(containerRef);

const maxHeight = 800; // Maximum height for the scrollable area
const padding = { top: 10, right:0, bottom: 0, left: 0 };
const chartWidth = computed(() => {
  // Chart takes up remaining space after title column
  return (containerWidth.value || 800) * 0.6; // 60% for chart, 40% for title
});

// Get all years from data
const allYears = computed(() => {
  const yearsSet = new Set<number>();
  props.data.forEach((topic) => {
    topic.years.forEach((y) => yearsSet.add(y.year));
  });
  return Array.from(yearsSet).sort((a, b) => a - b);
});

const yearRange = computed(() => {
  if (allYears.value.length === 0) return [0, 0];
  return [min(allYears.value) || 0, max(allYears.value) || 0];
});

// Scales
const xScale = computed(() => {
  if (chartWidth.value <= 0 || yearRange.value[0] === yearRange.value[1]) {
    return scaleLinear().domain([0, 1]).range([0, chartWidth.value]);
  }
  return scaleLinear()
    .domain(yearRange.value)
    .range([0, chartWidth.value]);
});

const getYScale = (maxValue: number) => {
  if (maxValue === 0) return scaleLinear().domain([0, 1]).range([props.rowHeight - padding.top, padding.top]);
  return scaleLinear<number, number>()
    .domain([0, maxValue])
    .range([props.rowHeight - padding.top, padding.top]);
};

// Calculate global maximum across all topics
const globalMaxCount = computed(() => {
  let globalMax = 0;
  props.data.forEach((topic) => {
    const topicMax = max(topic.years, (d: { year: number; count: number }) => d.count) || 0;
    if (topicMax > globalMax) {
      globalMax = topicMax;
    }
  });
  return globalMax;
});

// Create a single y-scale using the global maximum
const globalYScale = computed(() => {
  return getYScale(globalMaxCount.value);
});

// Process data for each topic
const processedTopics = computed(() => {
  return props.data.map((topic) => {
    const maxCount = max(topic.years, (d: { year: number; count: number }) => d.count) || 0;
    
    // Create points for the line using global y-scale
    const points = allYears.value.map((year) => {
      const yearData = topic.years.find((y) => y.year === year);
      const count = yearData?.count || 0;
      return {
        year,
        count,
        x: xScale.value(year),
        y: globalYScale.value(count),
      };
    });

    // Generate path - baseline is at rowHeight - padding.top
    const baselineY = props.rowHeight - padding.top;
    const path = points.length > 0 
      ? `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`
      : "";

    return {
      ...topic,
      maxCount,
      points,
      path,
      yScale: globalYScale.value,
      baselineY,
    };
  });
});

// Scrolling logic
const maxVisibleRows = computed(() => {
  return Math.floor(maxHeight / props.rowHeight);
});

const scrollIndex = ref(0);

const canScrollUp = computed(() => scrollIndex.value > 0);
const canScrollDown = computed(() => {
  return scrollIndex.value < processedTopics.value.length - maxVisibleRows.value;
});

function scrollUp() {
  if (canScrollUp.value) scrollIndex.value--;
}

function scrollDown() {
  if (canScrollDown.value) scrollIndex.value++;
}

const visibleTopics = computed(() => {
  return processedTopics.value.slice(
    scrollIndex.value,
    scrollIndex.value + maxVisibleRows.value
  );
});

// Tooltip state
const tooltip = ref<{
  visible: boolean;
  x: number;
  y: number;
  year: number;
  count: number;
  topicLabel: string;
} | null>(null);

function showTooltip(event: MouseEvent, point: { year: number; count: number }, topicLabel: string, rowIndex: number) {
  const svgElement = (event.currentTarget as HTMLElement).closest('svg');
  if (!svgElement) return;
  
  const topic = processedTopics.value[scrollIndex.value + rowIndex];
  if (!topic) return;
  
  const svgRect = svgElement.getBoundingClientRect();
  const pointX = xScale.value(point.year);
  const pointY = topic.yScale(point.count);
  
  tooltip.value = {
    visible: true,
    x: svgRect.left + pointX,
    y: svgRect.top + pointY,
    year: point.year,
    count: point.count,
    topicLabel,
  };
}

function hideTooltip() {
  if (tooltip.value) {
    tooltip.value.visible = false;
  }
}

// Track which SVG canvas is being hovered
const hoveredSvgIndex = ref<number | null>(null);
</script>

<template>
  <div ref="containerRef" class="w-full bg-neutral-lightest border border-neutral-darkest">
    <div class="p-6">
      <h2 class="mb-6 font-mono text-xs font-bold uppercase tracking-[0.06em] text-neutral-darkest">
        PROJECTS EVOLUTION <span class="text-neutral-dark font-normal">BY</span> TOPIC
      </h2>
      
      <div class="relative" :style="{ maxHeight: `${maxHeight}px`, overflow: 'hidden' }">
        <!-- Scrollable content -->
        <div
          ref="scrollContainerRef"
          class="transition-transform duration-300"
          :style="{ transform: `translateY(-${scrollIndex * rowHeight}px)` }"
        >
          <!-- Each topic row -->
          <div
            v-for="(topic, index) in processedTopics"
            :key="topic.id"
            class="flex "
            :style="{ height: `${rowHeight}px` }"
          >
            <!-- First column: SVG chart -->
            <div class="flex-1 relative" :style="{ width: `${chartWidth}px` }">
              <svg
                :width="chartWidth"
                :height="rowHeight"
                class="overflow-visible"
                @mouseenter="hoveredSvgIndex = index"
                @mouseleave="hoveredSvgIndex = null; hideTooltip()"
              >
                <!-- Baseline (x-axis at 0) - acts as separator -->
                <line
                  :x1="0"
                  :y1="topic.baselineY"
                  :x2="chartWidth"
                  :y2="topic.baselineY"
                  stroke="#aaa"
                  stroke-width="1"
                />

                <!-- Line chart -->
                <path
                  v-if="topic.path"
                  :d="topic.path"
                  fill="none"
                  stroke="#1e63a2"
                  stroke-width="2"
                  class="transition-all"
                />

                <!-- All data points - visible when hovering over SVG -->
                <circle
                  v-for="(point, pointIndex) in topic.points"
                  :key="pointIndex"
                  :cx="point.x"
                  :cy="point.y"
                  :r="hoveredSvgIndex === index ? 4 : 0"
                  :fill="hoveredSvgIndex === index ? '#1e63a2' : 'transparent'"
                  :stroke="hoveredSvgIndex === index ? 'white' : 'transparent'"
                  :stroke-width="hoveredSvgIndex === index ? 2 : 0"
                  class="cursor-pointer transition-all pointer-events-none"
                />

                <!-- Hover detection circles (invisible, larger radius) -->
                <circle
                  v-for="(point, pointIndex) in topic.points"
                  :key="`hover-${pointIndex}`"
                  :cx="point.x"
                  :cy="point.y"
                  r="8"
                  fill="transparent"
                  stroke="transparent"
                  class="cursor-pointer"
                  @mouseenter="showTooltip($event, { year: point.year, count: point.count }, topic.label, index)"
                  @mouseleave="hideTooltip"
                />

                <!-- Highlighted point with tooltip -->
                <template v-for="(point, pointIndex) in topic.points" :key="`tooltip-${pointIndex}`">
                  <circle
                    v-if="tooltip?.visible && tooltip.topicLabel === topic.label && tooltip.year === point.year"
                    :cx="point.x"
                    :cy="point.y"
                    r="6"
                    fill="#1e63a2"
                    fill-opacity="0.3"
                    stroke="#1e63a2"
                    stroke-width="2"
                    class="pointer-events-none"
                  />
                </template>
              </svg>
            </div>

            <!-- Second column: Topic title -->
            <div class="flex items-center px-4" :style="{ width: `${(containerWidth || 800) * 0.4}px` }">
              <span class="text-sm text-gray-700">{{ topic.label }}</span>
            </div>
          </div>
        </div>

        <!-- Scroll controls -->
        <div
          v-if="processedTopics.length > maxVisibleRows"
          class="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2"
        >
          <!-- Scroll up button -->
          <button
            @click="scrollUp"
            :disabled="!canScrollUp"
            :class="[
              'w-12 h-12 flex items-center justify-center rounded-full transition-colors',
              canScrollUp
                ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                : 'bg-gray-50 cursor-not-allowed opacity-50'
            ]"
            type="button"
            aria-label="Scroll up"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              :class="canScrollUp ? 'text-gray-700' : 'text-gray-400'"
            >
              <path d="M19 15.5l-7-7-7 7 1.4 1.4 5.6-5.6 5.6 5.6 1.4-1.4z" />
            </svg>
          </button>

          <!-- Scroll down button -->
          <button
            @click="scrollDown"
            :disabled="!canScrollDown"
            :class="[
              'w-12 h-12 flex items-center justify-center rounded-full transition-colors',
              canScrollDown
                ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                : 'bg-gray-50 cursor-not-allowed opacity-50'
            ]"
            type="button"
            aria-label="Scroll down"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              :class="canScrollDown ? 'text-gray-700' : 'text-gray-400'"
            >
              <path d="M19 8.5l-7 7-7-7 1.4-1.4 5.6 5.6 5.6-5.6 1.4 1.4z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Tooltip -->
      <div
        v-if="tooltip?.visible"
        class="fixed z-50 border border-neutral-darkest bg-neutral-darkest px-2 py-1 text-xs text-neutral-lightest pointer-events-none"
        :style="{
          left: `${tooltip.x}px`,
          top: `${tooltip.y + 30}px`,
          transform: 'translateX(-50%)',
        }"
      >
        <div class="font-semibold">{{ tooltip.topicLabel }}</div>
        <div>{{ tooltip.year }}: {{ tooltip.count }} projects</div>
      </div>
    </div>
  </div>
</template>

