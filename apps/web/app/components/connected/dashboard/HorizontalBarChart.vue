<script setup>
import { scaleLinear, max, scaleQuantile } from "d3";
import { useElementSize } from "@vueuse/core";

const props = defineProps({
  globalData: {
    type: Array,
    required: true,
  },
  hasFilteredData: {
    type: Boolean,
    default: false,
  },
  formatter: {
    type: Function,
    default: (d) => d,
  },
  showDownloadBtn: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Chart Title",
  },
  colors: {
    type: Object,
    default: () => ({
      default: "#1e63a2",
      active: "#100007",
      gray: "#ede7df",
    }),
  },
  colorsScale: {
    type: Array,
    default: () => [
      "#e8eff6",
      "#d2e0ec",
      "#bbd0e3",
      "#9cc0db",
      "#78a1c7",
      "#4b82b5",
      "#1e63a2",
      "#13497c",
    ],
  },
  ratio: {
    type: Number,
    default: 1,
  },
  activeFilter: {
    type: Object,
    default: null,
  },
});

const emits = defineEmits(["setFilter"]);

const svgContainer = ref(null);
const svg = ref(null);
const { width: availableWidth } = useElementSize(svgContainer);

const availableHeight = computed(() => availableWidth.value / props.ratio);

const viewBoxWidth = 1080;
const viewBoxHeight = computed(() => viewBoxWidth / props.ratio);

const canvasWidth = computed(() => availableWidth.value);
const canvasHeight = computed(() => availableHeight.value);

const titleHeight = 96;
const topLabelHeight = 96;
const padding = { top: 48, right: 60, bottom: 60, left: 60 };
const xAxisHeight = 168;
const yAxisWidthLeft = 0;
const yAxisWidthRight = 320;

const availableHeighForBars =
  viewBoxHeight.value -
  titleHeight -
  xAxisHeight -
  topLabelHeight -
  padding.top -
  padding.bottom;

const availableWidthForBars =
  viewBoxWidth - padding.left - padding.right - yAxisWidthRight - yAxisWidthLeft;

const maxData = computed(() => {
  const maxCount = max(props.globalData, (d) => d.count || 0);
  const maxCountF = max(props.globalData, (d) => d.count_f || 0);
  return max([maxCount, maxCountF]) || 1;
});

const widthScale = computed(() => {
  return scaleLinear()
    .domain([0, maxData.value * 1.2])
    .range([0, availableWidthForBars]);
});

const onlyValuesArray = computed(() => {
  return props.globalData.map((d) => parseFloat(d.count || 0));
});

const colorScale = computed(() => {
  return scaleQuantile()
    .domain([0, max(onlyValuesArray.value) || 1])
    .range(props.colorsScale);
});

const barHeight = computed(() => {
  if (props.globalData.length < 8) return 90;
  return 48;
});

const barSpacing = computed(() => {
  if (props.globalData.length < 8) return 6;
  return 4;
});

const maxBarsInAvailableHeight = computed(() => {
  return Math.floor(availableHeighForBars / (barHeight.value + barSpacing.value));
});

const scrollIndex = ref(0);

function scrollUp() {
  if (scrollIndex.value > 0) scrollIndex.value--;
}

function scrollDown() {
  if (scrollIndex.value < props.globalData.length - maxBarsInAvailableHeight.value) {
    scrollIndex.value++;
  }
}

const hoverTextLabel = ref("");
const hoverTextFigure = ref("");
const vBarX = ref(-600);

function mouseoverHandler(event, d, isGlobal) {
  vBarX.value = isGlobal
    ? widthScale.value(d.count || 0)
    : widthScale.value(d.count_f || 0);

  if (props.hasFilteredData) {
    hoverTextFigure.value = isGlobal ? d.count : d.count_f;
  } else {
    hoverTextFigure.value = d.count;
  }

  hoverTextLabel.value = d.label;
}

function mouseoutHandler() {
  hoverTextLabel.value = "";
  hoverTextFigure.value = "";
  vBarX.value = -600;
}

function mouseclickHandler(event, d) {
  emits("setFilter", d);
}
</script>

<template>
  <div class="relative h-full bg-neutral-lightest border border-neutral-darkest">
    <div ref="svgContainer" class="w-full h-full">
      <svg
        ref="svg"
        class=""
        :width="canvasWidth"
        :height="canvasHeight"
        style="height: 500px;"
        :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
      >
        <g
          :transform="`translate(${padding.left},${padding.top})`"
          class="chart-content"
        >
          <!-- title -->
          <g>
            <text text-anchor="start" x="0%" y="1em" class="chart_h1">
              {{ props.title }}
            </text>
          </g>

          <!-- fixed horizontal lines -->
          <line
            :x1="0"
            :y1="titleHeight"
            :x2="viewBoxWidth - padding.left - padding.right"
            :y2="titleHeight"
            stroke="#ccc"
            stroke-width="1"
            stroke-dasharray="3 1"
          />

          <line
            :x1="0"
            :y1="titleHeight + topLabelHeight"
            :x2="viewBoxWidth - padding.left - padding.right"
            :y2="titleHeight + topLabelHeight"
            stroke="#ccc"
            stroke-width="1"
            stroke-dasharray="3 1"
          />

          <!-- space for labeling above bars -->
          <g
            :transform="`translate(0, ${topLabelHeight + topLabelHeight / 2 + 10})`"
          >
            <text
              class="text-[2.75em] antialiased"
              :x="viewBoxWidth - padding.right - padding.left"
              dx="0em"
              dy="0.2em"
              text-anchor="end"
            >
              {{ hoverTextLabel }}
            </text>

            <text
              class="text-5xl font-bold"
              :x="vBarX"
              :dx="vBarX > viewBoxWidth / 3 ? '-0.5em' : '0.5em'"
              dy="0.25em"
              :text-anchor="vBarX > viewBoxWidth / 3 ? 'end' : 'start'"
            >
              {{ hoverTextFigure }}
            </text>
          </g>

          <!-- bars canvas -->
          <g
            class="bars-canvas"
            :transform="`translate(0, ${titleHeight + topLabelHeight + barSpacing})`"
          >
            <g
              v-for="(bar, i) in globalData.slice(
                scrollIndex,
                scrollIndex + maxBarsInAvailableHeight
              )"
              :key="bar.label || bar.id"
              :transform="`translate(0, ${i * (barHeight + barSpacing)})`"
            >
              <!-- main text legend for bar -->
              <text
                text-anchor="end"
                :x="viewBoxWidth - padding.right - padding.left"
                :y="barHeight"
                dy="-1rem"
                class="chart_label cursor-pointer hover:fill-blue-600"
                @click="mouseclickHandler($event, bar)"
                @mouseover="mouseoverHandler($event, bar, true)"
                @mouseleave="mouseoutHandler"
              >
                {{ bar.label }}
              </text>

              <!-- global bar -->
              <rect
                :x="yAxisWidthLeft"
                :y="0"
                :height="barHeight"
                :width="widthScale(bar.count || 0)"
                :fill="hasFilteredData ? colors.gray : colorScale(bar.count || 0)"
                class="hover:brightness-90 cursor-pointer transition-all duration-300"
                @mouseover="mouseoverHandler($event, bar, true)"
                @mouseleave="mouseoutHandler"
                @click="mouseclickHandler($event, bar)"
              />

              <!-- filtered bar -->
              <rect
                v-if="hasFilteredData"
                :x="yAxisWidthLeft"
                :y="0"
                :height="barHeight"
                :width="widthScale(bar.count_f || 0)"
                :fill="colors.active"
                class="hover:brightness-75 transition-all duration-300"
                @mouseover="mouseoverHandler($event, bar, false)"
                @mouseleave="mouseoutHandler"
                @click="mouseclickHandler($event, bar)"
              />

              <!-- total count for bar -->
              <text
                v-if="!hasFilteredData"
                text-anchor="start"
                :x="widthScale(bar.count || 0) + 24"
                :y="barHeight / 2"
                dy=".35em"
                class="chart_hor_value"
              >
                {{ bar.count }}
              </text>

              <text
                v-if="hasFilteredData"
                text-anchor="start"
                :x="widthScale(bar.count_f || 0) + 24"
                :y="barHeight / 2"
                dy=".35em"
                class="chart_hor_value pointer-events-none"
              >
                {{ bar.count_f }}
              </text>

              <!-- line below -->
              <line
                :x1="0"
                :y1="barHeight"
                :x2="viewBoxWidth - padding.right - padding.left"
                :y2="barHeight"
                stroke="#ccc"
                stroke-width="1"
                stroke-dasharray="3 1"
              />
            </g>
          </g>

          <!-- scroll controls -->
          <g
            v-if="maxBarsInAvailableHeight < globalData.length"
            class="bar-chart-controls"
            :transform="`translate(${
              viewBoxWidth - padding.right - padding.left - 60 - 80
            }, ${
              maxBarsInAvailableHeight * (barHeight + barSpacing) +
              titleHeight +
              topLabelHeight +
              12
            })`"
          >
            <svg
              viewBox="0 0 24 24"
              width="72px"
              height="72px"
              @click="scrollUp"
              class="cursor-pointer hover:fill-blue-600"
            >
              <rect width="24" height="24" fill="transparent" />
              <path d="M19 15.5l-7-7-7 7 1.4 1.4 5.6-5.6 5.6 5.6 1.4-1.4z" />
            </svg>
            <svg
              viewBox="0 0 24 24"
              width="72px"
              height="72px"
              :x="72"
              @click="scrollDown"
              class="cursor-pointer hover:fill-blue-600"
            >
              <rect width="24" height="24" fill="transparent" />
              <path d="M19 8.5l-7 7-7-7 1.4-1.4 5.6 5.6 5.6-5.6 1.4 1.4z" />
            </svg>
          </g>

          <!-- vertical line following the mouse -->
          <line
            v-show="vBarX > 0"
            :y1="titleHeight"
            :y2="viewBoxHeight - xAxisHeight"
            stroke="#100007"
            stroke-width="3"
            :x1="vBarX"
            :x2="vBarX"
          />

          <!-- x axis -->
          <g id="axis" :transform="`translate(0,${viewBoxHeight - xAxisHeight})`">
            <line
              :x1="yAxisWidthLeft"
              y1="0"
              :x2="yAxisWidthLeft + availableWidthForBars"
              y2="0"
              stroke="black"
              stroke-width="2"
            />

            <g
              v-for="(d, i) in widthScale.nice().ticks(5)"
              :key="i"
              :transform="`translate(${yAxisWidthLeft + widthScale(d)}, 0)`"
            >
              <line x1="0" y1="0" x2="0" :y2="12" stroke="gray" stroke-width="1" />
              <text
                x="0"
                y="36"
                dy="1.2em"
                text-anchor="middle"
                class="chart_tick"
              >
                {{ formatter(d) }}
              </text>
            </g>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.chart_h1 {
  font-size: 1.7em;
  font-weight: 700;
  fill: #100007;
  font-family: "Martian Mono", monospace;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.chart_label {
  font-size: 1.5em;
  fill: #000;
}

.chart_hor_value {
  font-size: 1.25em;
  fill: #000;
}

.chart_tick {
  font-size: 1em;
  fill: #666;
}

rect {
  transition: width 0.3s ease-in-out;
}
</style>
