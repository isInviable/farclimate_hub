<template>
  <g>
    <!-- bars -->
    <g
      v-for="(bar, i) in visibleData"
      :key="bar.id || bar.label"
      :transform="`translate(0, ${i * spaceBetweenBars})`"
    >
      <text
        text-anchor="end"
        :x="screenWidth"
        :y="barHeight"
        dy="0rem"
        class="chart_label cursor-pointer hover:font-bold"
        :style="externalHoveredItemId === (bar.id || bar.iso) ? 'font-weight: bold' : ''"
        @mouseenter="onMouseover($event, bar, true)"
        @mouseleave="onMouseout($event)"
        @click="onClick($event, bar.id || bar.iso)"
      >
        {{ bar.label }}
      </text>

      <rect
        :x="0"
        :y="barSpacing / 2"
        :data-id="bar.label"
        :height="barHeight"
        :width="widthScale(bar.count || 0)"
        :fill="
          highLightSelectedRegionId !== (bar.id || bar.iso)
            ? hasFilteredData
              ? colors.gray
              : colorScale(bar.count || 0)
            : colors.active
        "
        class="stroke-white stroke-2 hover:brightness-110 cursor-pointer transition-[filter] duration-300"
        :class="[externalHoveredItemId === (bar.id || bar.iso) ? 'brightness-110' : '']"
        @mouseenter="onMouseover($event, bar, true)"
        @mouseleave="onMouseout($event)"
        @click="onClick($event, bar.id || bar.iso)"
      />

      <!-- filtered bar -->
      <rect
        v-if="hasFilteredData"
        :x="0"
        :y="barSpacing / 2"
        :data-id="bar.label"
        :height="barHeight"
        :width="widthScale(bar.count_f || 0)"
        :fill="colors.active"
        class="hover:brightness-75 transition-[filter] duration-300"
        @mouseover="onMouseover($event, bar, false)"
        @mouseleave="onMouseout($event)"
        @click="onClick($event, bar.id || bar.iso)"
      />

      <text
        text-anchor="start"
        :x="widthScale(bar.count || 0)"
        :y="barHeight / 2"
        dy=".45em"
        dx="1em"
        class="chart_hor_value"
      >
        {{ bar.count }}
      </text>

      <!-- line below -->
      <line
        :x1="0"
        :y1="spaceBetweenBars"
        :x2="screenWidth"
        :y2="spaceBetweenBars"
        stroke="#ccc"
        stroke-width="1"
        stroke-dasharray="3 1"
      />
    </g>

    <!-- scroll controls -->
    <g
      v-if="maxBarsInAvailableHeight < data.length"
      class="bar-chart-controls"
      :transform="`translate(${screenWidth - 140}, ${maxBarsInAvailableHeight * spaceBetweenBars + 12})`"
    >
      <svg
        viewBox="0 0 24 24"
        width="56px"
        height="56px"
        @click="scrollUp"
        class="cursor-pointer hover:fill-trust-blue-darkest"
      >
        <rect width="24" height="24" fill="transparent" />
        <path d="M19 15.5l-7-7-7 7 1.4 1.4 5.6-5.6 5.6 5.6 1.4-1.4z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        width="56px"
        height="56px"
        :x="56"
        @click="scrollDown"
        class="cursor-pointer hover:fill-trust-blue-darkest"
      >
        <rect width="24" height="24" fill="transparent" />
        <path d="M19 8.5l-7 7-7-7 1.4-1.4 5.6 5.6 5.6-5.6 1.4 1.4z" />
      </svg>
    </g>
  </g>

  <!-- x axis -->
  <g
    id="axis"
    :transform="`translate(0, ${availableHeightForBars + 8})`"
  >
    <g>
      <rect
        v-for="(d, i) in colorScale.range()"
        :key="i"
        :fill="colorScale.range()[i]"
        :x="i * ((screenWidth * 2) / 3.5 / colorScale.range().length)"
        y="-12"
        :width="(screenWidth * 2) / 3.5 / colorScale.range().length"
        height="8"
      />
    </g>

    <!-- axis ticks -->
    <g
      v-for="(d, i) in axisTicks"
      :key="i"
      :transform="`translate(${axisWidthScale(d)}, 0)`"
    >
      <line x1="0" y1="0" x2="0" :y2="12" stroke="gray" stroke-width="1" />
      <text x="0" y="20" dy="1.0em" text-anchor="middle" class="chart_tick">
        {{ formatter(d) }}
      </text>
    </g>
  </g>
</template>

<script setup>
import { max, scaleQuantile } from "d3";

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  colorsScale: {
    type: Array,
    default: () => [
      "#dbebff",
      "#c2dffc",
      "#a8d3f8",
      "#8ec6f5",
      "#74baf1",
      "#59aded",
      "#3d9fe9",
      "#1f91e5",
      "#0082e1",
    ],
  },
  colors: {
    type: Object,
    default: () => ({ active: "#0082e1", inactive: "#f5f500" }),
  },
  viewBoxWidth: {
    type: Number,
    required: true,
  },
  viewBoxHeight: {
    type: Number,
    required: true,
  },
  screenWidth: {
    type: Number,
    required: true,
  },
  screenHeight: {
    type: Number,
    required: true,
  },
  formatter: {
    type: Function,
    default: (d) => d,
  },
  externalHoveredItemId: {
    type: String,
    default: null,
  },
  widthScale: {
    type: Function,
    required: true,
  },
  highLightSelectedRegionId: {
    type: String,
    default: null,
  },
  hasFilteredData: {
    type: Boolean,
    default: false,
  },
  activeFilter: {
    type: Object,
    default: null,
  },
});

const padding = { top: 0, right: 60, bottom: 0, left: 60 };
const xAxisHeight = 96;
const titleHeight = 96;
const topLabelHeight = 96;
const contentStartY = titleHeight + topLabelHeight;
const barHeight = 30;
const barSpacing = 4;

const onlyValuesArray = computed(() => {
  return props.data.map((d) => parseFloat(d.count || 0));
});

const colorScale = computed(() => {
  return scaleQuantile()
    .domain([0, max(onlyValuesArray.value) || 1])
    .range(props.colorsScale);
});

const axisWidthScale = computed(() => props.widthScale.copy().nice());

const axisTicks = computed(() =>
  axisWidthScale.value.ticks(colorScale.value.range().length)
);

const spaceBetweenBars = computed(() => barHeight + barSpacing);

const availableHeightForBars = computed(() => {
  return Math.max(0, props.viewBoxHeight - xAxisHeight - contentStartY - padding.bottom);
});

const maxBarsInAvailableHeight = computed(() => {
  return Math.floor(availableHeightForBars.value / spaceBetweenBars.value);
});

const scrollIndex = ref(0);

const visibleData = computed(() => {
  return props.data.slice(
    scrollIndex.value,
    scrollIndex.value + maxBarsInAvailableHeight.value
  );
});

function scrollUp() {
  if (scrollIndex.value > 0) scrollIndex.value--;
}

function scrollDown() {
  if (scrollIndex.value < props.data.length - maxBarsInAvailableHeight.value) {
    scrollIndex.value++;
  }
}

watch(() => props.data.length, () => {
  scrollIndex.value = 0;
});

const emits = defineEmits(["_mouseover", "_mouseout", "_click"]);

function onMouseover(event, barObject, isGlobal) {
  if (isGlobal && props.hasFilteredData) return;
  emits("_mouseover", barObject.id || barObject.iso, isGlobal);
}

function onMouseout(event) {
  emits("_mouseout");
}

function onClick(event, id) {
  emits("_click", id);
}
</script>

<style lang="css" scoped>
.chart_label {
  font-size: 1.2em;
  fill: #000;
}

.chart_hor_value {
  font-size: 1.0em;
  fill: #000;
}

.chart_tick {
  font-size: 1em;
  fill: #666;
}
</style>
