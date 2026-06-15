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
const { width: containerWidth } = useElementSize(containerRef);

const maxHeight = 800;
const axisHeight = 40;
const xAxisPadding = 28;
const padding = { top: 10, right: xAxisPadding, bottom: 0, left: xAxisPadding };
const chartWidth = computed(() => (containerWidth.value || 800) * 0.6);
const titleWidth = computed(() => (containerWidth.value || 800) * 0.4);
const plotWidth = computed(() => Math.max(0, chartWidth.value - padding.left - padding.right));

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

const xScale = computed(() => {
  if (plotWidth.value <= 0 || yearRange.value[0] === yearRange.value[1]) {
    return scaleLinear().domain([0, 1]).range([padding.left, chartWidth.value - padding.right]);
  }
  return scaleLinear()
    .domain(yearRange.value)
    .range([padding.left, chartWidth.value - padding.right]);
});

const xTicks = computed(() => {
  if (allYears.value.length === 0) return [];
  if (allYears.value.length <= 14) return allYears.value;
  return xScale.value.ticks(Math.min(8, allYears.value.length));
});

const chartAreaHeight = computed(() => axisHeight + maxHeight);

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

  const topic = processedTopics.value[rowIndex];
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
      
      <div class="relative flex">
        <!-- Chart column: x-axis + scrollable sparklines -->
        <div class="relative shrink-0" :style="{ width: `${chartWidth}px` }">
          <!-- Vertical grid lines: axis through visible chart area -->
          <svg
            class="pointer-events-none absolute left-0 top-0 z-0"
            :width="chartWidth"
            :height="chartAreaHeight"
            aria-hidden="true"
          >
            <line
              v-for="year in xTicks"
              :key="`grid-${year}`"
              :x1="xScale(year)"
              :y1="0"
              :x2="xScale(year)"
              :y2="chartAreaHeight"
              stroke="#e8e8e8"
              stroke-width="1"
            />
          </svg>

          <!-- Year axis -->
          <svg
            :width="chartWidth"
            :height="axisHeight"
            class="relative z-10 block overflow-visible"
            aria-hidden="true"
          >
            <line
              :x1="padding.left"
              :y1="axisHeight - 1"
              :x2="chartWidth - padding.right"
              :y2="axisHeight - 1"
              stroke="#100007"
              stroke-width="1"
            />
            <g v-for="year in xTicks" :key="`tick-${year}`">
              <line
                :x1="xScale(year)"
                :y1="axisHeight - 10"
                :x2="xScale(year)"
                :y2="axisHeight - 1"
                stroke="#aaa"
                stroke-width="1"
              />
              <text
                :x="xScale(year)"
                :y="axisHeight - 14"
                text-anchor="middle"
                class="axis-year-label"
              >
                {{ year }}
              </text>
            </g>
          </svg>

          <div class="relative z-10" :style="{ maxHeight: `${maxHeight}px`, overflow: 'hidden' }">
            <div
              class="transition-transform duration-300"
              :style="{ transform: `translateY(-${scrollIndex * rowHeight}px)` }"
            >
              <div
                v-for="(topic, index) in processedTopics"
                :key="topic.id"
                :style="{ height: `${rowHeight}px` }"
              >
                <svg
                  :width="chartWidth"
                  :height="rowHeight"
                  class="relative z-10 overflow-visible"
                  @mouseenter="hoveredSvgIndex = index"
                  @mouseleave="hoveredSvgIndex = null; hideTooltip()"
                >
                  <!-- Baseline (y = 0) -->
                  <line
                    :x1="padding.left"
                    :y1="topic.baselineY"
                    :x2="chartWidth - padding.right"
                    :y2="topic.baselineY"
                    stroke="#ccc"
                    stroke-width="1"
                  />

                  <path
                    v-if="topic.path"
                    :d="topic.path"
                    fill="none"
                    stroke="#1e63a2"
                    stroke-width="2"
                    class="transition-all"
                  />

                  <circle
                    v-for="(point, pointIndex) in topic.points"
                    :key="pointIndex"
                    :cx="point.x"
                    :cy="point.y"
                    :r="hoveredSvgIndex === index ? 4 : 0"
                    :fill="hoveredSvgIndex === index ? '#1e63a2' : 'transparent'"
                    :stroke="hoveredSvgIndex === index ? 'white' : 'transparent'"
                    :stroke-width="hoveredSvgIndex === index ? 2 : 0"
                    class="pointer-events-none cursor-pointer transition-all"
                  />

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
            </div>
          </div>
        </div>

        <!-- Topic labels column -->
        <div class="shrink-0" :style="{ width: `${titleWidth}px` }">
          <div :style="{ height: `${axisHeight}px` }" aria-hidden="true" />
          <div class="relative" :style="{ maxHeight: `${maxHeight}px`, overflow: 'hidden' }">
            <div
              class="transition-transform duration-300"
              :style="{ transform: `translateY(-${scrollIndex * rowHeight}px)` }"
            >
              <div
                v-for="topic in processedTopics"
                :key="`label-${topic.id}`"
                class="flex items-center px-4"
                :style="{ height: `${rowHeight}px` }"
              >
                <span class="text-sm text-gray-700">{{ topic.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Scroll controls -->
        <div
          v-if="processedTopics.length > maxVisibleRows"
          class="absolute right-4 flex flex-col gap-2"
          :style="{ top: `${axisHeight + maxHeight / 2}px`, transform: 'translateY(-50%)' }"
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

<style scoped>
.axis-year-label {
  font-size: 11px;
  fill: #666;
  font-family: "Martian Mono", monospace;
}
</style>
