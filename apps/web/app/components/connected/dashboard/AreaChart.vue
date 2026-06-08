<script setup>
import {
  scaleLinear,
  scalePoint,
  max,
  area,
  line,
  curveCatmullRom,
  bisect,
  range,
} from "d3";
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
  activeFilter: {
    type: Object,
    default: null,
  },
  formatter: {
    type: Function,
    default: (d) => d,
  },
  colors: {
    type: Object,
    default: () => ({
      default: "#bbd0e3",
      active: "#100007",
      gray: "#ede7df",
    }),
  },
  showDownloadBtn: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Chart Title",
  },
});

const emits = defineEmits(["setFilter"]);

const svgContainer = ref(null);
const svg = ref(null);
const { width: availableWidth } = useElementSize(svgContainer);

const viewBoxWidth = 1080;
const viewBoxHeight = 1080;

const canvasWidth = computed(() => availableWidth.value);
const canvasHeight = computed(() => availableWidth.value);

const titleHeight = 96;
const topLabelHeight = 96;
const padding = { top: 48, right: 60, bottom: 60, left: 60 };
const xAxisHeight = 180;
const yAxisWidthLeft = 240;
const yAxisWidthRight = 0;

const availableHeighForBars =
  viewBoxHeight -
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

const bandScale = computed(() => {
  const h_values = props.globalData.map((e) => e.label);
  return scalePoint()
    .domain(h_values)
    .range([yAxisWidthLeft, viewBoxWidth - padding.right - padding.left]);
});

const heightScale = computed(() => {
  return scaleLinear()
    .domain([0, maxData.value * 1.2])
    .range([availableHeighForBars + titleHeight - padding.top, 0]);
});

const areaGenerator = computed(() => {
  return area()
    .x((d) => bandScale.value(d.label))
    .y0((d) => heightScale.value(0))
    .y1((d) => heightScale.value(d.count || 0))
    .curve(curveCatmullRom.alpha(0.5));
});

const lineGenerator = computed(() => {
  return line()
    .x((d) => bandScale.value(d.label))
    .y((d) => heightScale.value(d.count || 0))
    .curve(curveCatmullRom.alpha(0.5));
});

const areaGenerator_f = computed(() => {
  return area()
    .x((d) => bandScale.value(d.label))
    .y0((d) => heightScale.value(0))
    .y1((d) => heightScale.value(d.count_f || 0))
    .curve(curveCatmullRom.alpha(0.5));
});

const lineGenerator_f = computed(() => {
  return line()
    .x((d) => bandScale.value(d.label))
    .y((d) => heightScale.value(d.count_f || 0))
    .curve(curveCatmullRom.alpha(0.5));
});

const filterMode = computed(() => {
  return props.hasFilteredData;
});

const mouseXPosition = ref(0);
const scaleFactor = computed(() => availableWidth.value / viewBoxWidth);

const setMouseXPosition = (event) => {
  mouseXPosition.value = event.offsetX / scaleFactor.value;
};

const onMouseExitCanvas = () => {
  mouseXPosition.value = 0;
};

const closerXValueToMouseX = computed(() => {
  const xPos = mouseXPosition.value;
  const domain = bandScale.value.domain();
  const _range = bandScale.value.range();
  const rangePoints = range(
    _range[0],
    _range[1] + bandScale.value.step(),
    bandScale.value.step()
  );
  return domain[bisect(rangePoints, xPos) - 1];
});

const vBarX = computed(() => {
  return bandScale.value(closerXValueToMouseX.value) > 0
    ? bandScale.value(closerXValueToMouseX.value)
    : -100;
});

const hoverTextLabel = ref("");
const hoverTextFigure = ref("");

watch(closerXValueToMouseX, (newValue) => {
  if (newValue == 0 || newValue == undefined) {
    hoverTextLabel.value = "";
    hoverTextFigure.value = "";
  } else {
    setHoverTextLabels(newValue);
  }
});

function setHoverTextLabels(year) {
  const dataForYear = props.globalData.find((d) => d.label == year);
  if (dataForYear) {
    hoverTextLabel.value = String(year);
    if (props.hasFilteredData) {
      hoverTextFigure.value = `${dataForYear.count_f || 0} / ${dataForYear.count || 0}`;
    } else {
      hoverTextFigure.value = String(dataForYear.count || 0);
    }
  }
}

function mouseclickHandler(event, d) {
  emits("setFilter", d);
}
</script>

<template>
  <div class="relative bg-neutral-lightest border border-neutral-darkest">
    <div ref="svgContainer" class="w-full">
      <svg
        ref="svg"
        class=""
        :width="canvasWidth"
        :height="canvasHeight"
        :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
        @mousemove="setMouseXPosition($event)"
        @mouseleave="onMouseExitCanvas"
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
            :x2="yAxisWidthLeft + availableWidthForBars"
            :y2="titleHeight"
            stroke="#ccc"
            stroke-width="1"
            stroke-dasharray="3 1"
          />

          <!-- space for labeling above bars -->
          <g
            class="chart-top-label"
            :transform="`translate(0, ${topLabelHeight + topLabelHeight / 2 + 10})`"
          >
            <text
              class="text-4xl font-light"
              :x="vBarX"
              dx="-0.666em"
              dy="0px"
              text-anchor="end"
            >
              {{ hoverTextLabel }}
            </text>

            <text
              class="text-5xl font-bold"
              :x="vBarX"
              dx="-0.5em"
              dy="1em"
              text-anchor="end"
            >
              {{ hoverTextFigure }}
            </text>
          </g>

          <!-- axis ticks -->
          <g
            v-for="(d, i) in heightScale.ticks(7)"
            :key="i"
            :transform="`translate(0, ${titleHeight + topLabelHeight + heightScale(d)})`"
          >
            <line
              x1="0"
              y1="0"
              :x2="availableWidthForBars + yAxisWidthLeft"
              y2="0"
              stroke="#ccc"
              stroke-width="1"
              stroke-dasharray="3 1"
            />
            <text
              x="0"
              y="8"
              dy="1.25em"
              text-anchor="start"
              class="chart_tick"
            >
              {{ formatter(d) }}
            </text>
          </g>

          <!-- canvas -->
          <g
            class="area-canvas"
            :transform="`translate(0,${titleHeight + topLabelHeight})`"
          >
            <!-- area C -->
            <path
              :fill="filterMode ? colors.gray : colors.default"
              stroke="none"
              :d="areaGenerator(globalData)"
            />

            <path
              :stroke="filterMode ? '#B3B3B3' : '#000'"
              :stroke-width="filterMode ? 6 : 12"
              fill="none"
              :d="lineGenerator(globalData)"
            />

            <!-- area F -->
            <g>
              <path
                v-if="filterMode"
                :fill="colors.default"
                stroke="none"
                :d="areaGenerator_f(globalData)"
              />

              <!-- vertical line following the mouse -->
              <line
                v-show="mouseXPosition > 0"
                :y1="titleHeight * -1"
                :y2="availableHeighForBars + titleHeight / 2"
                stroke="#100007"
                stroke-width="3"
                :x1="vBarX"
                :x2="vBarX"
              />

              <path
                v-if="filterMode"
                stroke="#000"
                stroke-width="12"
                fill="none"
                :d="lineGenerator_f(globalData)"
              />

              <!-- circle background -->
              <circle
                v-for="(c, i) in globalData"
                :key="c.label"
                :cx="bandScale(c.label)"
                :cy="heightScale(c.count || 0)"
                r="12"
                :style="{
                  fill:
                    c.label == closerXValueToMouseX
                      ? colors.active
                      : '#fff',
                }"
                stroke-width="6"
                :stroke="filterMode ? '#B3B3B3' : '#000'"
                class="cursor-pointer"
                @click="mouseclickHandler($event, c)"
              />

              <circle
                v-if="filterMode"
                v-for="(c, i) in globalData"
                :key="`f-${c.label}`"
                :cx="bandScale(c.label)"
                :cy="heightScale(c.count_f || 0)"
                r="12"
                :style="{
                  fill:
                    c.label == closerXValueToMouseX
                      ? colors.active
                      : '#fff',
                }"
                stroke-width="8"
                stroke="#000"
              />
            </g>
          </g>
        </g>

        <!-- x axis -->
        <g
          id="axis"
          :transform="`translate(0, ${
            titleHeight +
            topLabelHeight +
            padding.top +
            availableHeighForBars +
            padding.top
          })`"
        >
          <line
            :x1="yAxisWidthLeft + padding.left"
            y1="0"
            :x2="yAxisWidthLeft + padding.left + availableWidthForBars"
            y2="0"
            stroke="black"
            stroke-width="2"
          />

          <g
            v-for="(ttt, i) in globalData"
            :key="i"
            :transform="`translate(${padding.left}, 0)`"
          >
            <text
              :x="bandScale(ttt.label)"
              y="36"
              dy="1.2em"
              text-anchor="middle"
              class="chart_tick cursor-pointer"
              :style="{
                fill:
                  ttt.label == closerXValueToMouseX
                    ? colors.active
                    : '#000',
              }"
              @click="mouseclickHandler($event, ttt)"
            >
              {{ formatter(ttt.label) }}
            </text>

            <line
              :x1="bandScale(ttt.label)"
              y1="0"
              :x2="bandScale(ttt.label)"
              :y2="12"
              stroke="gray"
              stroke-width="1"
            />
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

.chart_tick {
  font-size: 1em;
  fill: #666;
}
</style>
